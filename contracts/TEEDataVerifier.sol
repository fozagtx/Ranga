// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {
    AccessProof,
    IERC7857DataVerifier,
    OracleType,
    OwnershipProof,
    TransferValidityProof,
    TransferValidityProofOutput
} from "./interfaces/IERC7857DataVerifier.sol";

contract TEEDataVerifier is IERC7857DataVerifier, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    error InvalidOracle();
    error InvalidProof();
    error ProofAlreadyUsed();

    event TeeOracleUpdated(address indexed previousOracle, address indexed newOracle);

    address public teeOracleAddress;
    mapping(bytes32 proofId => bool used) public usedProofs;

    constructor(address initialTeeOracleAddress) Ownable(msg.sender) {
        _setTeeOracleAddress(initialTeeOracleAddress);
    }

    function setTeeOracleAddress(address newTeeOracleAddress) external onlyOwner {
        _setTeeOracleAddress(newTeeOracleAddress);
    }

    function verifyTransferValidity(TransferValidityProof[] calldata proofs)
        external
        returns (TransferValidityProofOutput[] memory outputs)
    {
        if (proofs.length == 0) {
            revert InvalidProof();
        }

        outputs = new TransferValidityProofOutput[](proofs.length);
        for (uint256 i = 0; i < proofs.length; i++) {
            outputs[i] = _verifyProof(proofs[i]);
        }
    }

    function _verifyProof(TransferValidityProof calldata proof)
        private
        returns (TransferValidityProofOutput memory output)
    {
        AccessProof calldata accessProof = proof.accessProof;
        OwnershipProof calldata ownershipProof = proof.ownershipProof;

        if (
            ownershipProof.oracleType != OracleType.TEE || accessProof.oldDataHash == bytes32(0)
                || accessProof.newDataHash == bytes32(0) || accessProof.oldDataHash != ownershipProof.oldDataHash
                || accessProof.newDataHash != ownershipProof.newDataHash || accessProof.proof.length != 65
                || ownershipProof.proof.length != 65 || ownershipProof.sealedKey.length == 0
        ) {
            revert InvalidProof();
        }

        bytes32 accessProofId = _proofId("ACCESS", accessProof.oldDataHash, accessProof.newDataHash, accessProof.nonce);
        bytes32 ownershipProofId =
            _proofId("OWNERSHIP", ownershipProof.oldDataHash, ownershipProof.newDataHash, ownershipProof.nonce);
        if (usedProofs[accessProofId] || usedProofs[ownershipProofId]) {
            revert ProofAlreadyUsed();
        }

        address accessAssistant = _accessMessageHash(accessProof).recover(accessProof.proof);
        if (accessAssistant == address(0)) {
            revert InvalidProof();
        }

        address oracleSigner = _ownershipMessageHash(ownershipProof).recover(ownershipProof.proof);
        if (oracleSigner != teeOracleAddress) {
            revert InvalidProof();
        }

        usedProofs[accessProofId] = true;
        usedProofs[ownershipProofId] = true;

        output = TransferValidityProofOutput({
            oldDataHash: accessProof.oldDataHash,
            newDataHash: accessProof.newDataHash,
            sealedKey: ownershipProof.sealedKey,
            encryptedPubKey: ownershipProof.encryptedPubKey,
            wantedKey: accessProof.encryptedPubKey,
            accessAssistant: accessAssistant,
            accessProofNonce: accessProof.nonce,
            ownershipProofNonce: ownershipProof.nonce
        });
    }

    function _setTeeOracleAddress(address newTeeOracleAddress) private {
        if (newTeeOracleAddress == address(0)) {
            revert InvalidOracle();
        }
        address previousOracle = teeOracleAddress;
        teeOracleAddress = newTeeOracleAddress;
        emit TeeOracleUpdated(previousOracle, newTeeOracleAddress);
    }

    function _accessMessageHash(AccessProof calldata proof) private pure returns (bytes32) {
        return keccak256(abi.encode("OG_MEMORY_VAULT_ACCESS", proof.oldDataHash, proof.newDataHash, proof.encryptedPubKey, proof.nonce))
            .toEthSignedMessageHash();
    }

    function _ownershipMessageHash(OwnershipProof calldata proof) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                "OG_MEMORY_VAULT_OWNERSHIP",
                proof.oldDataHash,
                proof.newDataHash,
                proof.sealedKey,
                proof.encryptedPubKey,
                proof.nonce
            )
        ).toEthSignedMessageHash();
    }

    function _proofId(
        string memory scope,
        bytes32 oldDataHash,
        bytes32 newDataHash,
        bytes calldata nonce
    ) private view returns (bytes32) {
        return keccak256(abi.encode(scope, msg.sender, oldDataHash, newDataHash, nonce));
    }
}
