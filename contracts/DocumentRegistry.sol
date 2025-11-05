// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentRegistry {
    struct Document {
        string docType;
        string docHash;
        string metadata;
        address uploader;
        uint256 timestamp;
    }

    mapping(uint256 => Document) public documents;
    uint256 public documentCount;

    event DocumentStored(
        uint256 indexed docId,
        string docType,
        string docHash,
        address indexed uploader,
        uint256 timestamp
    );

    function storeDocument(
        string memory _docType,
        string memory _docHash,
        string memory _metadata
    ) public returns (uint256) {
        documentCount++;
        
        documents[documentCount] = Document({
            docType: _docType,
            docHash: _docHash,
            metadata: _metadata,
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        emit DocumentStored(
            documentCount,
            _docType,
            _docHash,
            msg.sender,
            block.timestamp
        );

        return documentCount;
    }

    function getDocument(uint256 _docId) public view returns (
        string memory docType,
        string memory docHash,
        string memory metadata,
        address uploader,
        uint256 timestamp
    ) {
        require(_docId > 0 && _docId <= documentCount, "Invalid document ID");
        
        Document memory doc = documents[_docId];
        return (
            doc.docType,
            doc.docHash,
            doc.metadata,
            doc.uploader,
            doc.timestamp
        );
    }

    function getDocumentCount() public view returns (uint256) {
        return documentCount;
    }
}
