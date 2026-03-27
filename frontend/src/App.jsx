import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import contractConfig from "./contractConfig.json";

const STATUS = {
  IDLE: "Idle",
  PENDING: "Pending",
  SUCCESS: "Success",
  ERROR: "Error"
};

const parseRows = (rows) => {
  const addresses = [];
  const amounts = [];

  const lines = rows
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const [address, amount] = lines[i].split(",").map((part) => part?.trim());

    if (!address || !amount) {
      throw new Error(`Invalid row ${i + 1}. Expected format: address,amount`);
    }

    if (!ethers.utils.isAddress(address)) {
      throw new Error(`Invalid address at row ${i + 1}`);
    }

    const parsedAmount = ethers.utils.parseEther(amount);
    if (parsedAmount.lte(0)) {
      throw new Error(`Amount must be > 0 at row ${i + 1}`);
    }

    addresses.push(address);
    amounts.push(parsedAmount);
  }

  if (!addresses.length) {
    throw new Error("Add at least one recipient row.");
  }

  return { addresses, amounts };
};

function App() {
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [rows, setRows] = useState("0x000000000000000000000000000000000000dEaD,0.001");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);

  const contractReady = useMemo(() => {
    return Boolean(contractConfig.contractAddress && contractConfig.abi?.length);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask not found.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const net = await provider.getNetwork();
      setAccount(accounts[0] || "");
      setNetwork(`${net.name} (${net.chainId})`);
      setError("");
    } catch (connectError) {
      setError(connectError.message || "Wallet connection failed.");
    }
  };

  const sendBatchPayment = async () => {
    if (!window.ethereum) {
      setError("MetaMask not found.");
      return;
    }

    if (!contractReady) {
      setError("Contract not configured. Set CONTRACT_ADDRESS and run sync script.");
      return;
    }

    try {
      setStatus(STATUS.PENDING);
      setTxHash("");
      setError("");

      const { addresses, amounts } = parseRows(rows);
      const total = amounts.reduce((acc, value) => acc.add(value), ethers.BigNumber.from(0));

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractConfig.contractAddress, contractConfig.abi, signer);

      const tx = await contract.payMultiple(addresses, amounts, { value: total });
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setStatus(STATUS.SUCCESS);
      } else {
        setStatus(STATUS.ERROR);
        setError("Transaction reverted.");
      }
    } catch (sendError) {
      setStatus(STATUS.ERROR);
      setError(sendError?.error?.message || sendError?.reason || sendError.message || "Transaction failed.");
    }
  };

  useEffect(() => {
    if (!window.ethereum || !contractReady) {
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractConfig.contractAddress, contractConfig.abi, provider);

    const onPayment = (
      batchId,
      sender,
      recipient,
      amount,
      recipientIndex,
      timestamp
    ) => {
      setEvents((prev) => {
        const next = [
          {
            id: `${batchId}-${recipientIndex.toString()}-${timestamp.toString()}`,
            batchId,
            sender,
            recipient,
            amount: ethers.utils.formatEther(amount),
            index: recipientIndex.toString(),
            timestamp: new Date(Number(timestamp) * 1000).toLocaleString()
          },
          ...prev
        ];

        return next.slice(0, 8);
      });
    };

    contract.on("PaymentSent", onPayment);
    return () => {
      contract.off("PaymentSent", onPayment);
    };
  }, [contractReady]);

  return (
    <main className="app-shell">
      <section className="card">
        <h1>Payment Tracker</h1>
        <p>Multi-address ETH payouts with live status + events</p>

        <div className="row">
          <button onClick={connectWallet}>Connect Wallet</button>
          <button onClick={sendBatchPayment}>Send Batch Payment</button>
        </div>

        <div className="meta">
          <strong>Wallet:</strong> {account || "Not connected"}
        </div>
        <div className="meta">
          <strong>Network:</strong> {network || "Unknown"}
        </div>
        <div className="meta">
          <strong>Contract:</strong> {contractConfig.contractAddress || "Not set"}
        </div>

        <div className="status status-block">
          <strong>Transaction Status:</strong> {status}
        </div>

        {txHash && (
          <div className="status">
            <strong>Tx Hash:</strong> {txHash}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <label htmlFor="rows">Recipients (one line each: address,amountInEth)</label>
        <textarea
          id="rows"
          rows={8}
          value={rows}
          onChange={(event) => setRows(event.target.value)}
        />
      </section>

      <section className="card">
        <h2>Real-time Payment Events</h2>
        {!events.length && <p>No events yet.</p>}
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id}>
              <div><strong>Recipient:</strong> {event.recipient}</div>
              <div><strong>Amount:</strong> {event.amount} ETH</div>
              <div><strong>Batch:</strong> {event.batchId}</div>
              <div><strong>When:</strong> {event.timestamp}</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
