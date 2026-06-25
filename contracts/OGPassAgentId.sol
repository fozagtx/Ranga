// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC7857} from "./interfaces/IERC7857.sol";
import {
    IERC7857DataVerifier,
    TransferValidityProof,
    TransferValidityProofOutput
} from "./interfaces/IERC7857DataVerifier.sol";
import {IntelligentData} from "./interfaces/IERC7857Metadata.sol";

contract OGPassAgentId is IERC7857, Ownable {
    error InvalidAddress();
    error InvalidProof();
    error NotApprovedOrOwner();
    error NotTokenOwner();
    error TokenDoesNotExist();
    error VerifierUnavailable();

    event AgentMinted(uint256 indexed tokenId, address indexed owner);
    event MemoryAnchored(
        uint256 indexed tokenId,
        bytes32 indexed dataHash,
        string storageRoot,
        bytes32 ciphertextHash,
        string dataDescription
    );
    event VerifierUpdated(address indexed previousVerifier, address indexed newVerifier);

    string private _name;
    string private _symbol;
    IERC7857DataVerifier private _verifier;
    uint256 private _nextTokenId = 1;

    mapping(uint256 tokenId => address owner) private _owners;
    mapping(uint256 tokenId => address approved) private _tokenApprovals;
    mapping(address owner => mapping(address operator => bool approved)) private _operatorApprovals;
    mapping(uint256 tokenId => IntelligentData[] data) private _intelligentData;
    mapping(uint256 tokenId => mapping(address user => bool authorized)) private _authorized;
    mapping(uint256 tokenId => address[] users) private _authorizedUsers;
    mapping(address user => address assistant) private _delegateAccess;

    constructor(string memory collectionName, string memory collectionSymbol, address verifierAddress)
        Ownable(msg.sender)
    {
        if (bytes(collectionName).length == 0 || bytes(collectionSymbol).length == 0) {
            revert InvalidProof();
        }
        _name = collectionName;
        _symbol = collectionSymbol;
        _setVerifier(verifierAddress);
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function verifier() external view returns (IERC7857DataVerifier) {
        return _verifier;
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        if (tokenOwner == address(0)) {
            revert TokenDoesNotExist();
        }
        return tokenOwner;
    }

    function intelligentDataOf(uint256 tokenId) external view returns (IntelligentData[] memory) {
        _requireMinted(tokenId);
        return _intelligentData[tokenId];
    }

    function authorizedUsersOf(uint256 tokenId) external view returns (address[] memory) {
        _requireMinted(tokenId);
        return _authorizedUsers[tokenId];
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        _requireMinted(tokenId);
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address tokenOwner, address operator) external view returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function getDelegateAccess(address user) public view returns (address) {
        return _delegateAccess[user];
    }

    function mintAgent(address to, IntelligentData[] calldata initialData) external returns (uint256) {
        if (to == address(0) || initialData.length == 0) {
            revert InvalidAddress();
        }
        if (msg.sender != owner() && to != msg.sender) {
            revert NotApprovedOrOwner();
        }

        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _copyIntelligentData(tokenId, initialData);

        emit AgentMinted(tokenId, to);
        return tokenId;
    }

    function anchorMemory(
        uint256 tokenId,
        string calldata dataDescription,
        bytes32 dataHash,
        string calldata storageRoot,
        bytes32 ciphertextHash
    ) external {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) {
            revert NotApprovedOrOwner();
        }
        if (bytes(dataDescription).length == 0 || dataHash == bytes32(0) || bytes(storageRoot).length == 0) {
            revert InvalidProof();
        }

        _intelligentData[tokenId].push(IntelligentData({dataDescription: dataDescription, dataHash: dataHash}));
        emit MemoryAnchored(tokenId, dataHash, storageRoot, ciphertextHash, dataDescription);
    }

    function setVerifier(address verifierAddress) external onlyOwner {
        _setVerifier(verifierAddress);
    }

    function iTransfer(address to, uint256 tokenId, TransferValidityProof[] calldata proofs) external {
        if (to == address(0)) {
            revert InvalidAddress();
        }
        if (!_isApprovedOrOwner(msg.sender, tokenId)) {
            revert NotApprovedOrOwner();
        }

        address from = ownerOf(tokenId);
        string[] memory descriptions = _descriptionsFor(tokenId);
        (TransferValidityProofOutput[] memory outputs, bytes[] memory sealedKeys) = _verifyDataTransfer(to, tokenId, proofs);

        _owners[tokenId] = to;
        delete _tokenApprovals[tokenId];
        delete _intelligentData[tokenId];

        for (uint256 i = 0; i < outputs.length; i++) {
            _intelligentData[tokenId].push(
                IntelligentData({
                    dataDescription: descriptions[i],
                    dataHash: outputs[i].newDataHash
                })
            );
        }

        emit Transferred(tokenId, from, to);
        emit PublishedSealedKey(to, tokenId, sealedKeys);
    }

    function iClone(address to, uint256 tokenId, TransferValidityProof[] calldata proofs) external returns (uint256) {
        if (to == address(0)) {
            revert InvalidAddress();
        }
        if (!_isApprovedOrOwner(msg.sender, tokenId)) {
            revert NotApprovedOrOwner();
        }

        string[] memory descriptions = _descriptionsFor(tokenId);
        (TransferValidityProofOutput[] memory outputs, bytes[] memory sealedKeys) = _verifyDataTransfer(to, tokenId, proofs);

        uint256 newTokenId = _nextTokenId++;
        _owners[newTokenId] = to;

        for (uint256 i = 0; i < outputs.length; i++) {
            _intelligentData[newTokenId].push(
                IntelligentData({
                    dataDescription: descriptions[i],
                    dataHash: outputs[i].newDataHash
                })
            );
        }

        emit Cloned(tokenId, newTokenId, ownerOf(tokenId), to);
        emit PublishedSealedKey(to, newTokenId, sealedKeys);
        return newTokenId;
    }

    function authorizeUsage(uint256 tokenId, address user) external {
        if (msg.sender != ownerOf(tokenId)) {
            revert NotTokenOwner();
        }
        if (user == address(0)) {
            revert InvalidAddress();
        }
        if (!_authorized[tokenId][user]) {
            _authorized[tokenId][user] = true;
            _authorizedUsers[tokenId].push(user);
            emit Authorization(msg.sender, user, tokenId);
        }
    }

    function revokeAuthorization(uint256 tokenId, address user) external {
        if (msg.sender != ownerOf(tokenId)) {
            revert NotTokenOwner();
        }
        if (_authorized[tokenId][user]) {
            _authorized[tokenId][user] = false;
            _removeAuthorizedUser(tokenId, user);
            emit AuthorizationRevoked(msg.sender, user, tokenId);
        }
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        if (msg.sender != tokenOwner && !_operatorApprovals[tokenOwner][msg.sender]) {
            revert NotApprovedOrOwner();
        }
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        if (operator == address(0) || operator == msg.sender) {
            revert InvalidAddress();
        }
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function delegateAccess(address assistant) external {
        _delegateAccess[msg.sender] = assistant;
        emit DelegateAccess(msg.sender, assistant);
    }

    function _setVerifier(address verifierAddress) private {
        if (verifierAddress == address(0) || verifierAddress.code.length == 0) {
            revert InvalidAddress();
        }
        address previousVerifier = address(_verifier);
        _verifier = IERC7857DataVerifier(verifierAddress);
        emit VerifierUpdated(previousVerifier, verifierAddress);
    }

    function _verifyDataTransfer(address to, uint256 tokenId, TransferValidityProof[] calldata proofs)
        private
        returns (TransferValidityProofOutput[] memory outputs, bytes[] memory sealedKeys)
    {
        _requireMinted(tokenId);
        if (address(_verifier) == address(0)) {
            revert VerifierUnavailable();
        }

        IntelligentData[] storage currentData = _intelligentData[tokenId];
        if (proofs.length == 0 || proofs.length != currentData.length) {
            revert InvalidProof();
        }

        outputs = _verifier.verifyTransferValidity(proofs);
        if (outputs.length != currentData.length) {
            revert InvalidProof();
        }

        sealedKeys = new bytes[](outputs.length);
        address delegatedAssistant = getDelegateAccess(to);
        for (uint256 i = 0; i < outputs.length; i++) {
            if (
                outputs[i].oldDataHash != currentData[i].dataHash || outputs[i].newDataHash == bytes32(0)
                    || outputs[i].oldDataHash != proofs[i].accessProof.oldDataHash
                    || outputs[i].newDataHash != proofs[i].accessProof.newDataHash
                    || outputs[i].oldDataHash != proofs[i].ownershipProof.oldDataHash
                    || outputs[i].newDataHash != proofs[i].ownershipProof.newDataHash
            ) {
                revert InvalidProof();
            }
            if (outputs[i].accessAssistant != to && outputs[i].accessAssistant != delegatedAssistant) {
                revert InvalidProof();
            }
            sealedKeys[i] = outputs[i].sealedKey;
        }
    }

    function _copyIntelligentData(uint256 tokenId, IntelligentData[] calldata data) private {
        delete _intelligentData[tokenId];
        for (uint256 i = 0; i < data.length; i++) {
            if (bytes(data[i].dataDescription).length == 0 || data[i].dataHash == bytes32(0)) {
                revert InvalidProof();
            }
            _intelligentData[tokenId].push(data[i]);
        }
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) private view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return spender == tokenOwner || _tokenApprovals[tokenId] == spender || _operatorApprovals[tokenOwner][spender];
    }

    function _requireMinted(uint256 tokenId) private view {
        if (_owners[tokenId] == address(0)) {
            revert TokenDoesNotExist();
        }
    }

    function _removeAuthorizedUser(uint256 tokenId, address user) private {
        address[] storage users = _authorizedUsers[tokenId];
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] == user) {
                users[i] = users[users.length - 1];
                users.pop();
                return;
            }
        }
    }

    function _descriptionsFor(uint256 tokenId) private view returns (string[] memory descriptions) {
        IntelligentData[] storage data = _intelligentData[tokenId];
        descriptions = new string[](data.length);
        for (uint256 i = 0; i < data.length; i++) {
            descriptions[i] = data[i].dataDescription;
        }
    }
}
