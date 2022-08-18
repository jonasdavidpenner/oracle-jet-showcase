function loadSankey(){
    require(["require", "exports", "knockout", '#APP_IMAGES#DemoSankeyLayout', "ojs/ojbootstrap", "ojs/ojarraydataprovider", "ojs/ojattributegrouphandler", "ojs/ojknockout", "ojs/ojdiagram"], function (require, exports, ko, layout, ojbootstrap_1, ArrayDataProvider, ojattributegrouphandler_1) {
        "use strict";
        
        class DiagramModel {
            constructor() {
                this.nodes = [];
                this.links = [];
                this.colorHandler = new ojattributegrouphandler_1.ColorAttributeGroupHandler();
                this.nodesMap = {};
                this.data = JSON.parse($v("P3_JSON_SANKEY"));
                console.log('Test');
                console.log(this.data);
                this.updateNodesWeight = (link) => {
                    const s = link.source, t = link.target;
                    if (s === this.data.nodes[0].id || s === this.data.nodes[1].id || s === this.data.nodes[2].id || s === this.data.nodes[3].id  || s === this.data.nodes[4].id || s === this.data.nodes[5].id || s === this.data.nodes[6].id || s === this.data.nodes[7].id || s === this.data.nodes[8].id || s === this.data.nodes[9].id || s === this.data.nodes[10].id
                    || s === this.data.nodes[11].id || s === this.data.nodes[11].id || s === this.data.nodes[12].id)
                        this.nodesMap[s]['weight'] = this.nodesMap[s]['weight']
                            ? this.nodesMap[s]['weight'] + link['items']
                            : link['items'];
                    this.nodesMap[t]['weight'] = this.nodesMap[t]['weight']
                        ? this.nodesMap[t]['weight'] + link.items
                        : link.items;
                };
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
                    shortDesc: this.nodesMap[source]['category'] === 'country'
                        ? o.items + ' ' + source + ' companies ' + this.nodesMap[target]['name']
                        : this.nodesMap[source]['name'] +
                            ' has ' +
                            o['count'] +
                            ' companies in ' +
                            this.nodesMap[target]['name']
                };
            }
        }
        ojbootstrap_1.whenDocumentReady().then(() => {
            ko.applyBindings(new DiagramModel(), document.getElementById('diagram-container'));
        });
    });
  }
  
  loadSankey();