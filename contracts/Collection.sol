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

contract Collection is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, Ownable, ERC721Burnable {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    Counters.Counter private _tokenIdCounter;
    string private _uri;
    uint256 private _mintEndTimestamp;
    uint256 private _maxSupply;
    mapping(string => uint256) private _invites;

    constructor(
        address creator,
        string memory name,
        string memory symbol,
        string memory uri,
        uint256 mintEndTimestamp,
        uint256 maxSupply
    ) ERC721(name, symbol) {
        transferOwnership(creator);
        _uri = uri;
        _mintEndTimestamp = mintEndTimestamp;
        _maxSupply = maxSupply;
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
        _setTokenURI(tokenId, _uri);

        if (inviteMaxUses != 0) {
            _bumpInviteCodeUsage(inviteCode);
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        require(balanceOf(to) == 0, 'Recipient already has a token');
        super._beforeTokenTransfer(from, to, tokenId);
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

    function _verifySignature(
        string memory inviteCode,
        uint256 maxUses,
        bytes memory signature,
        address account
    ) internal pure returns (bool) {
        bytes32 msgHash = keccak256(abi.encodePacked(inviteCode, maxUses));
        //bytes32 signedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        return msgHash.toEthSignedMessageHash().recover(signature) == account;
    }

    // The following functions are overrides required by Solidity.
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
