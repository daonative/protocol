// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Collection.sol';

contract CollectionCreator {
    Collection[] public allCollections;
    event CollectionCreated(address indexed newCollection);

    function createCollection(string memory name, string memory symbol) external returns (Collection) {
        Collection newCollection = new Collection(msg.sender, name, symbol);
        emit CollectionCreated(address(newCollection));
        allCollections.push(newCollection);
        return newCollection;
    }

    function getCollections() external view returns (Collection[] memory) {
        return allCollections;
    }
}