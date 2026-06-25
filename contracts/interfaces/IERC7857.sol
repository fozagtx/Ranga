// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {IERC7857DataVerifier, TransferValidityProof} from "./IERC7857DataVerifier.sol";
import {IERC7857Metadata} from "./IERC7857Metadata.sol";

interface IERC7857 is IERC7857Metadata {
    event Approval(address indexed from, address indexed to, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event Authorization(address indexed from, address indexed to, uint256 indexed tokenId);
    event AuthorizationRevoked(address indexed from, address indexed to, uint256 indexed tokenId);
    event Transferred(uint256 tokenId, address indexed from, address indexed to);
    event Cloned(uint256 indexed tokenId, uint256 indexed newTokenId, address from, address to);
    event PublishedSealedKey(address indexed to, uint256 indexed tokenId, bytes[] sealedKeys);
    event DelegateAccess(address indexed user, address indexed assistant);

    function verifier() external view returns (IERC7857DataVerifier);

    function iTransfer(address to, uint256 tokenId, TransferValidityProof[] calldata proofs) external;

    function iClone(address to, uint256 tokenId, TransferValidityProof[] calldata proofs) external returns (uint256);

    function authorizeUsage(uint256 tokenId, address user) external;

    function revokeAuthorization(uint256 tokenId, address user) external;

    function approve(address to, uint256 tokenId) external;

    function setApprovalForAll(address operator, bool approved) external;

    function delegateAccess(address assistant) external;

    function ownerOf(uint256 tokenId) external view returns (address);

    function authorizedUsersOf(uint256 tokenId) external view returns (address[] memory);

    function getApproved(uint256 tokenId) external view returns (address);

    function isApprovedForAll(address owner, address operator) external view returns (bool);

    function getDelegateAccess(address user) external view returns (address);
}
