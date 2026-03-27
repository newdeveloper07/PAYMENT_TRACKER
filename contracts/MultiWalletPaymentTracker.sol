// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MultiWalletPaymentTracker {
    error EmptyBatch();
    error LengthMismatch();
    error InvalidRecipient(uint256 index);
    error InvalidAmount(uint256 index);
    error InsufficientEth(uint256 expected, uint256 received);

    event BatchPaymentInitiated(
        bytes32 indexed batchId,
        address indexed sender,
        uint256 recipientCount,
        uint256 totalAmount
    );

    event PaymentSent(
        bytes32 indexed batchId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 recipientIndex,
        uint256 timestamp
    );

    event BatchPaymentCompleted(
        bytes32 indexed batchId,
        address indexed sender,
        uint256 totalAmount,
        uint256 timestamp
    );

    struct BatchSummary {
        bytes32 batchId;
        address sender;
        uint256 recipientCount;
        uint256 totalAmount;
        uint256 timestamp;
    }

    mapping(bytes32 => BatchSummary) public batchSummaries;

    function payMultiple(address[] calldata recipients, uint256[] calldata amounts) external payable {
        if (recipients.length == 0) revert EmptyBatch();
        if (recipients.length != amounts.length) revert LengthMismatch();

        uint256 total;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidRecipient(i);
            if (amounts[i] == 0) revert InvalidAmount(i);
            total += amounts[i];
        }

        if (msg.value != total) revert InsufficientEth(total, msg.value);

        bytes32 batchId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, recipients.length, total, block.number)
        );

        emit BatchPaymentInitiated(batchId, msg.sender, recipients.length, total);

        for (uint256 i = 0; i < recipients.length; i++) {
            (bool sent, ) = payable(recipients[i]).call{value: amounts[i]}("");
            require(sent, "Transfer failed");

            emit PaymentSent(batchId, msg.sender, recipients[i], amounts[i], i, block.timestamp);
        }

        batchSummaries[batchId] = BatchSummary({
            batchId: batchId,
            sender: msg.sender,
            recipientCount: recipients.length,
            totalAmount: total,
            timestamp: block.timestamp
        });

        emit BatchPaymentCompleted(batchId, msg.sender, total, block.timestamp);
    }
}
