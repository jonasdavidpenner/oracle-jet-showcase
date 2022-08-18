define(["require", "exports"], function (require, exports) {
    "use strict";
    class DemoSankeyLayout {
        constructor(ctx) {
            /**
             * Performs the layout
             */
            this.layout = () => {
                this._positionNodes();
                this._positionLinks();
            };
            /**
             * Positions the nodes in columns with sources on the left and sinks on the right.  All other nodes will be placed
             * in columns based on maximal distance from a source
             */
            this._positionNodes = () => {
                const columns = this._getColumns();
                // Calculate node positions iteratively
                for (let i = 0; i < 25; i++) {
                    this._iterateNodePositions(columns, true);
                    this._iterateNodePositions(columns, false);
                }
                // Position Node Labels
                for (let i = 0; i < columns.length; i++) {
                    const column = columns[i];
                    for (let j = 0; j < column.length; j++) {
                        // Get the position of the node
                        const node = this._ctx.getNodeById(column[j]);
                        const position = node.getPosition();
                        // Set the position of the node label on the right or left depending on the column index
                        const bounds = node.getContentBounds();
                        const labelBounds = node.getLabelBounds();
                        let labelPositionX = 0;
                        if (i < columns.length / 2) {
                            node.setLabelHalign("left");
                            labelPositionX = position.x + bounds.w + DemoSankeyLayout.LABEL_GAP;
                        }
                        else {
                            node.setLabelHalign("right");
                            labelPositionX = position.x - DemoSankeyLayout.LABEL_GAP;
                        }
                        node.setLabelPosition({
                            x: labelPositionX,
                            y: position.y + (bounds.h - labelBounds.h) / 2,
                        });
                    }
                }
            };
            /**
             * Positions a single column in order separated only by the rowGap
             *
             * @param {array} columns the array of columns
             * @param {number} columnIndex the index of the column to position
             */
            this._positionColumn = (columns, columnIndex) => {
                const column = columns[columnIndex];
                const x = columnIndex * DemoSankeyLayout.COLUMN_WIDTH;
                let y = 0;
                for (let i = 0; i < column.length; i++) {
                    // Set the position of the node
                    const node = this._ctx.getNodeById(column[i]);
                    node.setPosition({ x: x, y: y });
                    const bounds = node.getContentBounds();
                    y += bounds.h + DemoSankeyLayout.ROW_GAP;
                }
            };
            /**
             * Reposition nodes using weighted average of incoming or outgoing links
             *
             * @param {array} columns the array of columns
             * @param {boolean} upsteam whether to start at the sources and average downstream nodes or
             *                          to start at the sinks and average upstream nodes
             */
            this._iterateNodePositions = (columns, upstream) => {
                const start = upstream ? columns.length - 1 : 0;
                const end = upstream ? 0 : columns.length - 1;
                const step = upstream ? -1 : 1;
                const linkMap = upstream ? this["_outLinkMap"] : this["_inLinkMap"];
                // Explicitly position start column
                this._positionColumn(columns, start);
                // Use weighted average to position each successive column
                for (let i = start + step; i != end + step; i += step) {
                    const column = columns[i];
                    for (let j = 0; j < column.length; j++) {
                        const node = this._ctx.getNodeById(column[j]);
                        //var nodeSize = parseFloat(node.getLayoutAttributes()['size']);
                        const nodeSize = this._getNodeSize(node);
                        const links = linkMap[node.getId()];
                        let centerY = 0;
                        for (let k = 0; k < links.length; k++) {
                            const link = this._ctx.getLinkById(links[k]);
                            //var linkSize = parseFloat(link.getLayoutAttributes()['size']);
                            const linkSize = this._getLinkSize(link);
                            const linkedNodeId = upstream ? link.getEndId() : link.getStartId();
                            const linkedNode = this._ctx.getNodeById(linkedNodeId);
                            centerY +=
                                ((linkedNode.getPosition().y +
                                    linkedNode.getContentBounds().h / 2) *
                                    linkSize) /
                                    nodeSize;
                        }
                        node.setPosition({
                            x: i * DemoSankeyLayout.COLUMN_WIDTH,
                            y: centerY - node.getContentBounds().h / 2,
                        });
                    }
                }
                for (let i = 0; i < columns.length; i++) {
                    this._separateNodes(columns, i);
                }
            };
            /**
             * Separates any overlapping nodes in the specified column
             *
             * @param {array} columns the array of columns
             * @param {number} columnIndex the index of the column to separate
             */
            this._separateNodes = (columns, columnIndex) => {
                const ctx = this._ctx;
                let column = columns[columnIndex];
                // Sort the column based on center y position
                column.sort((a, b) => {
                    const nodeA = ctx.getNodeById(a);
                    const nodeB = ctx.getNodeById(b);
                    const centerA = nodeA.getPosition().y + nodeA.getContentBounds().h / 2;
                    const centerB = nodeB.getPosition().y + nodeB.getContentBounds().h / 2;
                    return centerA - centerB;
                });
                // If any consecutive nodes overlap, move the first node (and any preceding nodes) up by half the overlap and the
                // second node (and any following nodes) down by half the overlap
                if (column.length > 1) {
                    for (let i = 0; i < column.length - 1; i++) {
                        const nodeA = this._ctx.getNodeById(column[i]);
                        const nodeB = this._ctx.getNodeById(column[i + 1]);
                        const bottomA = nodeA.getPosition().y + nodeA.getContentBounds().h;
                        const topB = nodeB.getPosition().y;
                        if (bottomA + DemoSankeyLayout.ROW_GAP > topB) {
                            // Nodes overlap, calculate the adjustment
                            const adjustment = (bottomA + DemoSankeyLayout.ROW_GAP - topB) / 2;
                            for (let j = 0; j <= i; j++) {
                                const node = this._ctx.getNodeById(column[j]);
                                const position = node.getPosition();
                                node.setPosition({ x: position.x, y: position.y - adjustment });
                            }
                            for (let j = i + 1; j < column.length; j++) {
                                const node = this._ctx.getNodeById(column[j]);
                                const position = node.getPosition();
                                node.setPosition({ x: position.x, y: position.y + adjustment });
                            }
                        }
                    }
                }
            };
            /**
             * Positions the links as thick sequential curves down the sides of nodes
             */
            this._positionLinks = () => {
                const ctx = this._ctx;
                for (const nodeId in this["_inLinkMap"]) {
                    const inLinks = this["_inLinkMap"][nodeId];
                    inLinks.sort(function (a, b) {
                        const nodeA = ctx.getNodeById(ctx.getLinkById(a).getStartId());
                        const nodeB = ctx.getNodeById(ctx.getLinkById(b).getStartId());
                        const centerA = nodeA.getPosition().y + nodeA.getContentBounds().h / 2;
                        const centerB = nodeB.getPosition().y + nodeB.getContentBounds().h / 2;
                        return centerA - centerB;
                    });
                }
                for (const nodeId in this["_outLinkMap"]) {
                    const outLinks = this["_outLinkMap"][nodeId];
                    outLinks.sort(function (a, b) {
                        const nodeA = ctx.getNodeById(ctx.getLinkById(a).getEndId());
                        const nodeB = ctx.getNodeById(ctx.getLinkById(b).getEndId());
                        const centerA = nodeA.getPosition().y + nodeA.getContentBounds().h / 2;
                        const centerB = nodeB.getPosition().y + nodeB.getContentBounds().h / 2;
                        return centerA - centerB;
                    });
                }
                let linkCount = this._ctx.getLinkCount();
                for (let i = 0; i < linkCount; i++) {
                    const link = this._ctx.getLinkByIndex(i);
                    //var size = parseFloat(link.getLayoutAttributes()['size']);
                    const size = this._getLinkSize(link);
                    const startNode = this._ctx.getNodeById(link.getStartId());
                    const endNode = this._ctx.getNodeById(link.getEndId());
                    const startNodeLinks = this["_outLinkMap"][link.getStartId()];
                    const endNodeLinks = this["_inLinkMap"][link.getEndId()];
                    let linkStartTop = 0;
                    for (let j = 0; j < startNodeLinks.length; j++) {
                        if (startNodeLinks[j] == link.getId()) {
                            break;
                        }
                        const previousLink = this._ctx.getLinkById(startNodeLinks[j]);
                        //linkStartTop += parseFloat(previousLink.getLayoutAttributes()['size']);
                        linkStartTop += this._getLinkSize(previousLink);
                    }
                    let linkEndTop = 0;
                    for (let j = 0; j < endNodeLinks.length; j++) {
                        if (endNodeLinks[j] == link.getId()) {
                            break;
                        }
                        const previousLink = this._ctx.getLinkById(endNodeLinks[j]);
                        //linkEndTop += parseFloat(previousLink.getLayoutAttributes()['size']);
                        linkEndTop += this._getLinkSize(previousLink);
                    }
                    const startX = startNode.getPosition().x + startNode.getContentBounds().w;
                    const startY = startNode.getPosition().y + linkStartTop + size / 2;
                    const endX = endNode.getPosition().x;
                    const endY = endNode.getPosition().y + linkEndTop + size / 2;
                    link.setPoints([
                        "M",
                        startX,
                        startY,
                        "C",
                        DemoSankeyLayout.LINK_CURVATURE * startX +
                            (1 - DemoSankeyLayout.LINK_CURVATURE) * endX,
                        startY,
                        (1 - DemoSankeyLayout.LINK_CURVATURE) * startX +
                            DemoSankeyLayout.LINK_CURVATURE * endX,
                        endY,
                        endX,
                        endY,
                    ]);
                }
            };
            /**
             * Gets the center position of a node
             *
             * @param {string} id the id of the specified node
             * @return {Object} the center position of the specified node - an object containing x, y coordinates
             */
            this._getCenter = (id) => {
                const node = this._ctx.getNodeById(id);
                const position = node.getPosition();
                const bounds = node.getContentBounds();
                const center = {
                    x: position.x + bounds.w / 2,
                    y: position.y + bounds.h / 2,
                };
                return center;
            };
            /**
             * Creates maps of in links and out links indexed by node id
             */
            this._generateLinkMaps = () => {
                this["_inLinkMap"] = {};
                this["_outLinkMap"] = {};
                const linkCount = this._ctx.getLinkCount();
                for (let i = 0; i < linkCount; i++) {
                    const link = this._ctx.getLinkByIndex(i);
                    const linkId = link.getId();
                    const startId = link.getStartId();
                    const endId = link.getEndId();
                    let inLinks = this["_inLinkMap"][endId];
                    inLinks = inLinks ? inLinks : [];
                    let outLinks = this["_outLinkMap"][startId];
                    outLinks = outLinks ? outLinks : [];
                    inLinks.push(linkId);
                    outLinks.push(linkId);
                    this["_inLinkMap"][endId] = inLinks;
                    this["_outLinkMap"][startId] = outLinks;
                }
            };
            /**
             * Splits the nodes into columns
             *
             * @return {array} an array of arrays representing the columns from left to right
             */
            this._getColumns = () => {
                this._generateLinkMaps();
                const nodeCount = this._ctx.getNodeCount();
                const sources = [];
                const sinks = [];
                const distances = new Map();
                // Identify the sources and sinks
                // Initialize the distance map
                for (let i = 0; i < nodeCount; i++) {
                    const nodeId = this._ctx.getNodeByIndex(i).getId();
                    if (!this["_inLinkMap"][nodeId]) {
                        sources.push(nodeId);
                    }
                    if (!this["_outLinkMap"][nodeId]) {
                        sinks.push(nodeId);
                    }
                    distances.set(nodeId, 0);
                }
                // Breadth-first search following links from the sources and incrementing node distances as we find them
                let currentNodes = sources.slice(0);
                let distance = 1;
                let maxDistance;
                while (currentNodes.length > 0) {
                    let nextNodes = [];
                    for (let i = 0; i < currentNodes.length; i++) {
                        const outLinks = this["_outLinkMap"][currentNodes[i]];
                        if (outLinks) {
                            for (let j = 0; j < outLinks.length; j++) {
                                const link = this._ctx.getLinkById(outLinks[j]);
                                const end = link.getEndId();
                                distances.set(end, distance);
                                maxDistance = distance;
                                if (nextNodes.indexOf(end) == -1) {
                                    nextNodes.push(end);
                                }
                            }
                        }
                    }
                    currentNodes = nextNodes;
                    distance++;
                }
                const columnCount = maxDistance + 1;
                // Place all sinks in the rightmost column
                for (let i = 0; i < sinks.length; i++) {
                    distances[sinks[i]] = columnCount - 1;
                }
                let columns = [];
                for (let i = 0; i < columnCount; i++) {
                    columns[i] = [];
                }
                for (let i = 0; i < nodeCount; i++) {
                    const node = this._ctx.getNodeByIndex(i);
                    const id = node.getId();
                    columns[distances.get(id)].push(id);
                }
                return columns;
            };
            this._getNodeSize = (node, nodeData) => {
                return node.getContentBounds().h;
            };
            this._getLinkSize = (link) => {
                return link.getLinkWidth();
            };
            this._ctx = ctx;
        }
    }
    DemoSankeyLayout.COLUMN_WIDTH = 1000;
    DemoSankeyLayout.ROW_GAP = 15;
    DemoSankeyLayout.LABEL_GAP = 20;
    DemoSankeyLayout.LINK_CURVATURE = 0.33;
    /**
     * Main function that does the sankey layout (Layout entry point)
     * A columnar layout, with sources and sinks based on maximum source distance
     *
     * @param {DvtDiagramLayoutContext} ctx the layout context object
     */
    DemoSankeyLayout.layout = (ctx) => {
        new DemoSankeyLayout(ctx).layout();
    };
    return DemoSankeyLayout;
});