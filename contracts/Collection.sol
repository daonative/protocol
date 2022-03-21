// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

contract Collection is ERC721, ERC721Enumerable, Pausable, Ownable, ERC721Burnable {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    Counters.Counter private _tokenIdCounter;
    string private _uri;
    bool private _oneTokenPerWallet;
    uint256 private _mintEndTimestamp;
    uint256 private _maxSupply;
    mapping(string => uint256) private _invites;

    constructor(
        address creator,
        string memory name,
        string memory symbol,
        string memory uri,
        bool oneTokenPerWallet,
        uint256 mintEndTimestamp,
        uint256 maxTokenSupply
    ) ERC721(name, symbol) {
        transferOwnership(creator);
        _uri = uri;
        _mintEndTimestamp = mintEndTimestamp;
        _maxSupply = maxTokenSupply;
        _oneTokenPerWallet = oneTokenPerWallet;
    }

    function getMintEndTimestamp() public view returns (uint256) {
        return _mintEndTimestamp;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(
        string memory inviteCode,
        uint256 inviteMaxUses,
        bytes memory signature
    ) public {
        require(_maxSupply == 0 ||  totalSupply() < _maxSupply, 'Max supply exceeded');
        require(_mintEndTimestamp == 0 || block.timestamp < _mintEndTimestamp, 'Cannot mint outside of time window');
        require(_verifySignature(inviteCode, inviteMaxUses, signature, owner()) == true, 'Invalid signature');
        require(_verifyCodeMaxUses(inviteCode, inviteMaxUses) == true, 'Invalid invite code');

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        if (inviteMaxUses != 0) {
            _bumpInviteCodeUsage(inviteCode);
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        require(_verifyTokenAllowancePerWallet(to), 'Recipient already has a token');
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _verifyTokenAllowancePerWallet(address recipient) internal virtual returns (bool) {
        if (_oneTokenPerWallet == false) {
            return true;
        }

        return balanceOf(recipient) == 0;
    }

    function _bumpInviteCodeUsage(string memory inviteCode) internal virtual {
        _invites[inviteCode] += 1;
    }

    function _verifyCodeMaxUses(string memory inviteCode, uint256 inviteMaxUses) internal virtual returns (bool) {
        // Cannot turn a limited invite code into an unlimited invite code
        if (_invites[inviteCode] > 0 && inviteMaxUses == 0) {
            return false;
        }
        // Unlimited invite code
        if (inviteMaxUses == 0) {
            return true;
        }

        return _invites[inviteCode] < inviteMaxUses;
    }

    function collectionURI() public view returns (string memory) {
        return _uri;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function _verifySignature(
        string memory inviteCode,
        uint256 maxUses,
        bytes memory signature,
        address account
    ) internal pure returns (bool) {
        bytes32 msgHash = keccak256(abi.encodePacked(inviteCode, maxUses));
        return msgHash.toEthSignedMessageHash().recover(signature) == account;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");
        return _uri;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
