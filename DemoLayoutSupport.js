  "use strict";
  define(function() {
  
    var DemoLayoutSupport = {
    };
  
    DemoLayoutSupport.getMaxNodeBounds = function (layoutContext, excludeLabelBounds) {
      var nodeCount = layoutContext.getNodeCount();
      var maxW = 0;
      var maxH = 0;
      for (var ni = 0;ni < nodeCount;ni++) {
        var node = layoutContext.getNodeByIndex(ni);
        var bounds = node.getContentBounds();
        maxW = Math.max(bounds.w, maxW);
        maxH = Math.max(bounds.h, maxH);
        if (!excludeLabelBounds) {
          var labelBounds = node.getLabelBounds();
          if (labelBounds) {
            maxW = Math.max(labelBounds.w, maxW);
            maxH = Math.max(bounds.h + labelBounds.h, maxH);
          }
        }
      }
      return {'x': 0, 'y': 0, 'w': maxW, 'h': maxH};
    };
  
    DemoLayoutSupport.centerNodeAndLabel = function (layoutContext, node, x, y) {
      DemoLayoutSupport.centerNode(node, x, y);
      DemoLayoutSupport.positionNodeLabel(layoutContext, node);
    };
  
    DemoLayoutSupport.centerNode = function (node, x, y) {
      var bounds = node.getContentBounds();
      node.setPosition({'x':x - bounds.x - bounds.w * .5, 'y':y - bounds.y - bounds.h * .5});
    };
  
    DemoLayoutSupport.positionNodeLabels = function (layoutContext) {
      for (var ni = 0;ni < layoutContext.getNodeCount();ni++) {
        var node = layoutContext.getNodeByIndex(ni);
        DemoLayoutSupport.positionNodeLabel(layoutContext, node);
      }
    };
  
    DemoLayoutSupport.positionNodeLabel = function (layoutContext, node) {
      var nodeBounds = node.getContentBounds();
      var nodePos = node.getPosition();
      var nodeLabelBounds = node.getLabelBounds();
      if (nodeLabelBounds) {
        //center label below node
        var labelX = nodeBounds.x + nodePos.x + .5 * nodeBounds.w;
        var labelY = nodeBounds.y + nodePos.y + nodeBounds.h;
        node.setLabelPosition({'x':labelX, 'y':labelY});
        node.setLabelHalign("center");
      }
    };
  
    DemoLayoutSupport.getNodeComparator = function (attribute) {
      var comparator = function (a, b) {
        var valA = 0;
        var valB = 0;
        if (a.getLayoutAttributes() && a.getLayoutAttributes()[attribute]) {
          valA = a.getLayoutAttributes()[attribute];
        }
        if (b.getLayoutAttributes() && b.getLayoutAttributes()[attribute]) {
          valB = b.getLayoutAttributes()[attribute];
        }
        return valA > valB ? 1 : (valA == valB ? (a.getId() > b.getId() ? 1 :  - 1) :  - 1);
      };
      return comparator;
    };
  
    DemoLayoutSupport.layoutLinks = function (layoutContext) {
      for (var li = 0;li < layoutContext.getLinkCount();li++) {
        var link = layoutContext.getLinkByIndex(li);
        var endpoints = DemoLayoutSupport.getEndpoints(layoutContext, link);
  
        var startX = endpoints[0].x;
        var startY = endpoints[0].y;
        var endX = endpoints[1].x;
        var endY = endpoints[1].y;
        link.setPoints([startX, startY, endX, endY]);
        //center label on link
        var labelBounds = link.getLabelBounds();
        if (labelBounds) {
          var labelX = startX + .5 * (endX - startX);
          var labelY = startY + .5 * (endY - startY - labelBounds.h);
          link.setLabelPosition({'x': labelX, 'y': labelY});
          link.setLabelHalign("center");
        }
      }
    }
  
    DemoLayoutSupport.getEndpoints = function(layoutContext, link) {
      var layoutAttrs = layoutContext.getLayoutAttributes();
      //support for laying out links to connect at the edges of node
      //bounding boxes instead of at the centers
      var bLinkToBounds = true;
      if (layoutAttrs) {
        bLinkToBounds = (layoutAttrs["linkToBounds"] !== "false");
      }
  
      var n1 = layoutContext.getNodeById(link.getStartId());
      var n2 = layoutContext.getNodeById(link.getEndId());
  
      var n1Position = n1.getPosition();
      var n2Position = n2.getPosition();
  
      var b1 = n1.getContentBounds();
      var b2 = n2.getContentBounds();
  
      var startX = n1Position.x + b1.x + .5 * b1.w;
      var startY = n1Position.y + b1.y + .5 * b1.h;
      var endX = n2Position.x + b2.x + .5 * b2.w;
      var endY = n2Position.y + b2.y + .5 * b2.h;
  
      //support for laying out links to connect at the edges of node
      //bounding boxes instead of at the centers
      if (bLinkToBounds) {
        b1 = {'x': n1Position.x + b1.x, 'y': n1Position.y + b1.y, 'w': b1.w, 'h': b1.h};
        b2 = {'x': n2Position.x + b2.x, 'y': n2Position.y + b2.y, 'w': b2.w, 'h': b2.h};
  
        var startP = DemoLayoutSupport._intersectRect(b1, startX, startY, endX, endY, link.getStartConnectorOffset());
        var endP = DemoLayoutSupport._intersectRect(b2, endX, endY, startX, startY, link.getEndConnectorOffset());
        startX = startP.x;
        startY = startP.y;
        endX = endP.x;
        endY = endP.y;
      }
      var endpoints = [];
      endpoints.push({'x': startX, 'y': startY});
      endpoints.push({'x': endX, 'y': endY});
  
      return endpoints;
    }
  
    DemoLayoutSupport._intersectRect = function (rect, startX, startY, endX, endY, connOffset) {
      var SIDE_TOP = 0;
      var SIDE_RIGHT = 1;
      var SIDE_BOTTOM = 2;
      var SIDE_LEFT = 3;
  
      var halfRectW = .5 * rect.w;
      var halfRectH = .5 * rect.h;
      var cornerAngle = Math.atan2(halfRectH, halfRectW);
  
      var topRightAngle = cornerAngle;
      var topLeftAngle = Math.PI - cornerAngle;
      var bottomRightAngle =  - topRightAngle;
      var bottomLeftAngle =  - topLeftAngle;
  
      var lineAngle = Math.atan2(endY - startY, endX - startX);
      var side;
      if (lineAngle <= topRightAngle && lineAngle >= bottomRightAngle) {
        side = SIDE_RIGHT;
      }
      else if (lineAngle <= topLeftAngle && lineAngle >= topRightAngle) {
        side = SIDE_TOP;
      }
      else if (lineAngle >= bottomLeftAngle && lineAngle <= bottomRightAngle) {
        side = SIDE_BOTTOM;
      }
      else {
        side = SIDE_LEFT;
      }
  
      var x;
      var y;
      var tanAngle = (endY - startY) / (endX - startX);
      switch (side) {
        case SIDE_RIGHT:
          x = rect.x + rect.w;
          y = tanAngle * halfRectW + halfRectH + rect.y;
          break;
        case SIDE_LEFT:
          x = rect.x;
          y = tanAngle * ( - halfRectW) + halfRectH + rect.y;
          break;
        case SIDE_TOP:
          y = rect.y + rect.h;
          if (endX === startX) {
            x = startX;
          }
          else {
            x = (halfRectH / tanAngle) + halfRectW + rect.x;
          }
          break;
        case SIDE_BOTTOM:
          y = rect.y;
          if (endX === startX) {
            x = startX;
          }
          else {
            x = ( - halfRectH / tanAngle) + halfRectW + rect.x;
          }
          break;
      }
      if (connOffset) {
        x += Math.cos(lineAngle) * connOffset;
        y += Math.sin(lineAngle) * connOffset;
      }
      return {'x': x, 'y': y};
    }
  
    return DemoLayoutSupport;
  });