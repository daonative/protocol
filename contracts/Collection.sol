// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

contract Collection is ERC721, ERC721URIStorage, Pausable, Ownable, ERC721Burnable {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    Counters.Counter private _tokenIdCounter;
    string private _uri;
    uint private _mintEndTimestamp;
    mapping(string => uint) private _invites;

    constructor(
        address creator,
        string memory name,
        string memory symbol,
        string memory uri,
        uint mintEndTimestamp
    ) ERC721(name, symbol) {
        transferOwnership(creator);
        _uri = uri;
        _mintEndTimestamp = mintEndTimestamp;
    }

    function getMintEndTimestamp() public view returns (uint) {
        return _mintEndTimestamp;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(string memory inviteCode, uint maxUses, bytes memory signature) public {
        require(_mintEndTimestamp == 0 || block.timestamp < _mintEndTimestamp, "Cannot mint outside of time window");
        require(_verifySignature(inviteCode, maxUses, signature, owner()) == true, "Invalid signature");
        require(_verifyCodeMaxUses(inviteCode, maxUses) == true, "Invalid invite code");
        _bumpInviteCodeUsage(inviteCode);
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override whenNotPaused {
        require(balanceOf(to) == 0, "Recipient already has a token");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _bumpInviteCodeUsage(string memory inviteCode) internal virtual {
        _invites[inviteCode] += 1;
    }

    function _verifyCodeMaxUses(string memory inviteCode, uint maxUses) internal virtual returns (bool) {
        if (maxUses == 0) {
            return true;
        }
        return _invites[inviteCode] < maxUses;
    }

    function _verifySignature(
        string memory inviteCode,
        uint maxUses,
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

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
