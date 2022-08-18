require(["require", "exports", "knockout", '#APP_IMAGES#DemoSankeyLayout', "ojs/ojbootstrap", 'text!#APP_IMAGES#sochiOlympics.json', "ojs/ojarraydataprovider", "ojs/ojattributegrouphandler", "ojs/ojknockout", "ojs/ojdiagram"], function (require, exports, ko, layout, ojbootstrap_1, jsonData, ArrayDataProvider, ojattributegrouphandler_1) {
    "use strict";
    
    class DiagramModel {
        constructor() {
            this.nodes = [];
            this.links = [];
            this.colorHandler = new ojattributegrouphandler_1.ColorAttributeGroupHandler();
            this.nodesMap = {};
            this.updateNodesWeight = (link) => {
                const s = link.source, t = link.target;
                if (s === 'Gold' || s === 'Silver' || s === 'Bronze')
                    this.nodesMap[s]['weight'] = this.nodesMap[s]['weight']
                        ? this.nodesMap[s]['weight'] + link['items']
                        : link['items'];
                this.nodesMap[t]['weight'] = this.nodesMap[t]['weight']
                    ? this.nodesMap[t]['weight'] + link.items
                    : link.items;
            };
            this.data = JSON.parse(jsonData);
            this.createNode = (o) => {
                const id = o['id'];
                const weight = this.nodesMap[id]['weight'];
                return {
                    id: id,
                    label: id,
                    shortDesc: o['name'],
                    icon: { color: this.colorHandler.getValue(id), height: weight * 3 }
                };
            };
            this.layoutFunc = layout.layout;
            this.nodeDataProvider = new ArrayDataProvider(this.nodes, {
                keyAttributes: 'id'
            });
            this.linkDataProvider = new ArrayDataProvider(this.links, {
                keyAttributes: 'id'
            });
            this.styleDefaults = {
                nodeDefaults: {
                    labelStyle: { fontSize: '30px', fontWeight: 'bold' },
                    icon: { width: 70, shape: 'rectangle' }
                },
                linkDefaults: { svgStyle: { strokeOpacity: 0.5, vectorEffect: 'none' } }
            };
            for (let i = 0; i < this.data.nodes.length; i++) {
                this.nodesMap[this.data.nodes[i]['id']] = this.data.nodes[i];
            }
            for (let i = 0; i < this.data.links.length; i++) {
                this.links.push(this.createLink(this.data.links[i]));
            }
            for (let nodeId in this.nodesMap) {
                this.nodes.push(this.createNode(this.nodesMap[nodeId]));
            }
        }
        createLink(o) {
            this.updateNodesWeight(o);
            const source = o.source, target = o.target;
            return {
                id: o.id,
                startNode: source,
                endNode: target,
                width: o.items * 3,
                shortDesc: this.nodesMap[source]['category'] === 'award'
                    ? o.items + ' ' + source + ' medals for ' + this.nodesMap[target]['name']
                    : this.nodesMap[source]['name'] +
                        ' won ' +
                        o['items'] +
                        ' medals in ' +
                        this.nodesMap[target]['name']
            };
        }
    }
    ojbootstrap_1.whenDocumentReady().then(() => {
        ko.applyBindings(new DiagramModel(), document.getElementById('diagram-container'));
    });
});