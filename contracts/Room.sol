// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Room {
    struct Proposal {
        bytes32 id;
        address creator;
        string uri;
    }

    event Transfer(address indexed from, address indexed to, uint256 value);

    event SubmitProposal(Proposal proposal);
    event Vote(uint256 amount, bytes32 proposalId);
    uint256 randNonce = 0;

    function rand() internal returns (bytes32) {
        randNonce++;
        return keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce));
    }

    mapping(address => uint256) public balances;

    mapping(address => string[]) public contributorProposals;

    mapping(bytes32 => address) public proposalToContributor;

    Proposal[] public proposals;

    string URI;
    address creator;

    constructor(address _creator, string memory _URI) {
        creator = _creator;
        URI = _URI;
    }

    function getURI() public view returns (string memory) {
        return URI;
    }

    function vote(bytes32 proposalId, uint256 _amount) public {
        require(proposalId.length > 0, 'proposalId length should be higher than 0');
        require(_amount <= balances[msg.sender], 'vote amount should not be higher than sender balance');
        address contributorAddress = proposalToContributor[proposalId];
        balances[msg.sender] -= _amount;
        balances[contributorAddress] += _amount;
        emit Vote(_amount, proposalId);
    }

    function submitProposal(string memory _uri) public {
        require(bytes(_uri).length > 0, '_uri must not be empty');
        bytes32 proposalId = rand();
        proposals.push(Proposal(proposalId, msg.sender, _uri));
        contributorProposals[msg.sender].push(_uri);
        proposalToContributor[proposalId] = msg.sender;
        emit SubmitProposal(Proposal(proposalId, msg.sender, _uri));
    }

    function getMyProposals() public view returns (string[] memory) {
        return contributorProposals[msg.sender];
    }

    function getProposals() public view returns (Proposal[] memory) {
        return proposals;
    }

    function deposit() external payable {
        require(msg.value > 0, 'amount should be non null');
        balances[msg.sender] += msg.value;
        emit Transfer(msg.sender, address(this), msg.value);
    }

    function withdraw(uint256 _amount) external {
        require(_amount <= balances[msg.sender], 'withdrawal _amount cannot be higher than sender balance');
        (bool success, ) = msg.sender.call{value: _amount}('');
        balances[msg.sender] -= _amount;
        require(success, 'Transfer failed.');

        emit Transfer(address(this), msg.sender, _amount);
    }

    function getDeposit() external view returns (uint256) {
        return balances[msg.sender];
    }
}
