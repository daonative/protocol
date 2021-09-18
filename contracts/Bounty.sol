// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Bounty {
    struct Article {
        bytes32 id;
        address creator;
        string uri;
    }

    event Transfer(address indexed from, address indexed to, uint256 value);

    event SubmitAnswer(Article article);
    event Vote(uint256 amount, bytes32 articleId);
    uint256 randNonce = 0;

    function rand() internal returns (bytes32) {
        randNonce++;
        return keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce));
    }

    mapping(address => uint256) public balances;

    mapping(address => string[]) public writerArticles;

    mapping(bytes32 => address) public articleToWriter;

    Article[] public articles;

    string URI;
    address creator;

    constructor(address _creator, string memory _URI) {
        creator = _creator;
        URI = _URI;
    }

    function getURI() public view returns (string memory) {
        return URI;
    }

    function vote(bytes32 articleId, uint256 _amount) public {
        require(articleId.length > 0, 'articleId length should be higher than 0');
        require(_amount <= balances[msg.sender], 'vote amount should not be higher than sender balance');
        address writerAddress = articleToWriter[articleId];
        balances[msg.sender] -= _amount;
        balances[writerAddress] += _amount;
        emit Vote(_amount, articleId);
    }

    function submitAnswer(string memory _uri) public {
        require(bytes(_uri).length > 0, '_uri must not be empty');
        bytes32 articleId = rand();
        articles.push(Article(articleId, msg.sender, _uri));
        writerArticles[msg.sender].push(_uri);
        articleToWriter[articleId] = msg.sender;
        emit SubmitAnswer(Article(articleId, msg.sender, _uri));
    }

    function getMyAnswers() public view returns (string[] memory) {
        return writerArticles[msg.sender];
    }

    function getAnswers() public view returns (Article[] memory) {
        return articles;
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
