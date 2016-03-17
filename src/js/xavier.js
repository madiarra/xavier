/*

Copyright 2014 - 2016 Roland Bouman (roland.bouman@gmail.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/
function XavierApplication(xavierOptions){

var app = this;
Observable.apply(app, xavierOptions);

if (!xavierOptions) {
  xavierOptions = {};
}

var metadataFilter = xavierOptions.metadataFilter;
if (!metadataFilter) {
  metadataFilter = {};
}
var xmlaMetadataFilter = new XmlaMetadataFilter(metadataFilter);
app.xmlaMetadataFilter = xmlaMetadataFilter;

doc.title = gMsg("XML/A Visualizer");

var xmla;
if (xavierOptions.xmla) {
  xmla = xavierOptions.xmla;
}
else {
  showAlert("Unexpected error", "Xmla object not available.");
  return;
}

var dnd = new DDHandler({
  node: body
});
SplitPane.listenToDnd(dnd);

/**
*   Toolbar
*/
var mainToolbar = null;

if (xavierOptions.createToolbar !== false) {
  mainToolbar = new Toolbar({
    container: body
  });
  mainToolbar.addButton([
    {"class": "refresh", tooltip: gMsg("Refresh metadata")},
    {"class": "separator"},
  ]);
}
app.toolbar = mainToolbar;


/**
*   Init and manage visualizations
*/
var getVisualizationById = function(id){
  var visualizations = xavierOptions.visualizations;
  var n = visualizations.length, i, visualization;
  for (i = 0; i < n; i++) {
    visualization = visualizations[i];
    if (visualization.id !== id) {
      continue;
    }
    return visualization;
  }
  return null;
}
app.getVisualizationById = getVisualizationById;

function createVisualizationTab(conf){
  var id = conf.id;
  var visualization = getVisualizationById(id);
  if (!visualization) {
    console.log("Error: can't find visualization for button " + className);
    return;
  }
  var componentConstructor = visualization.componentConstructor;
  var tabConf = merge({
    tabPane: workArea
  }, conf);
  var vizualizationInstance = componentConstructor.newInstance(tabConf);
  var tab = workArea.newTab(vizualizationInstance);
  return tab;
}
app.createVisualizationTab = createVisualizationTab;

var autoRunEnabled = iDef(xavierOptions.autoRunEnabled) ? xavierOptions.autoRunEnabled : true;
/**
*   Create toolbar buttons for visualizations
*/
if (mainToolbar) {
  var visualizationButtonClicked = function(){
    var buttonConf = this.conf;
    var className = buttonConf["class"];
    var id = className.substr("new-".length);
    createVisualizationTab({
      id: id
    });
  };
  var visualizations = xavierOptions.visualizations, n = visualizations.length, i, visualization, componentConstructor, buttonConf;
  for (i = 0; i < n; i++){
    visualization = visualizations[i];
    if (visualization.createToolbarButton === false) {
      continue;
    }
    buttonConf = {
      "class": "new-" + visualization.id,
      tooltip: gMsg(visualization.tooltip),
      group: "vis",
      buttonHandler: visualizationButtonClicked
    };
    mainToolbar.addButton(buttonConf);
  }

  /**
  *   Misc generic toolbarbuttons
  */
  mainToolbar.addButton([
    {"class": "separator"},
    {
      "class": "auto-run", 
      group: "visaction", 
      tooltip: gMsg("Toggle Autorun Query"), 
      toggleGroup: "auto-run", 
      depressed: autoRunEnabled
    },
    {"class": "run", group: "visaction", tooltip: gMsg("Run Query")},
    {"class": "separator"},
    {"class": "excel", group: "visaction", tooltip: gMsg("Export to Microsoft Excel")},
    {"class": "separator"},
    {"class": "clear", group: "visaction", tooltip: gMsg("Discard this query and start over")}
  ]);

  mainToolbar.listen({
    buttonPressed: function(toolbar, event, button){
      var conf = button.conf;
      if (iFun(conf.buttonHandler)) {
        conf.buttonHandler.call(button);
      }
      else {
        var className = conf["class"];
        switch (className) {
          case "run":
            workArea.executeQuery();
            break;
          case "clear":
            workArea.clear();
            break
          case "excel":
            workArea.exportToExcel();
            break
          default:
            throw "Not implemented";
        }
      }
    },
    afterToggleGroupStateChanged: function(toolbar, event, data){
      var depressedButton = toolbar.getDepressedButtonInToggleGroup(data.group);
      switch (data.group) {
        case "auto-run":
          toggleAutoRunEnabled();
          break;
      }
    }
  });
}

function getAutoRunEnabled(){
  return autoRunEnabled;
}

function toggleAutoRunEnabled() {
  var setting = getAutoRunEnabled();
  autoRunEnabled = !setting;
  if (mainToolbar) {
    mainToolbar.displayButton("run", !autoRunEnabled);
  }
  workArea.setAutoRunEnabled(autoRunEnabled);
}

/**
*   TreeView
*/
var xmlaTreeView = new XmlaTreeView({
  xmla: xmla,
  xmlaMetadataFilter: xmlaMetadataFilter,
  metadataRestrictions: xavierOptions.metadataRestrictions,
  catalogNodesInitiallyFlattened: iDef(xavierOptions.catalogNodesInitiallyFlattened) ? xavierOptions.catalogNodesInitiallyFlattened : XmlaTreeView.prototype.catalogNodesInitiallyFlattened,
  showCatalogNodesCheckboxDisplayed: iDef(xavierOptions.showCatalogNodesCheckboxDisplayed) ? xavierOptions.showCatalogNodesCheckboxDisplayed : XmlaTreeView.prototype.showCatalogNodesCheckboxDisplayed,
  useCatalogPrefixForCubes: iDef(xavierOptions.useCatalogPrefixForCubes) ? xavierOptions.useCatalogPrefixForCubes : XmlaTreeView.prototype.useCatalogPrefixForCubes,
  showCurrentCatalog: iDef(xavierOptions.showCurrentCatalog) ? xavierOptions.showCurrentCatalog : XmlaTreeView.prototype.showCurrentCatalog,
  showCurrentCube: iDef(xavierOptions.showCurrentCube) ? xavierOptions.showCurrentCube : XmlaTreeView.prototype.showCurrentCube,
  dimensionNodesInitiallyFlattened: iDef(xavierOptions.dimensionNodesInitiallyFlattened) ? xavierOptions.dimensionNodesInitiallyFlattened : XmlaTreeView.prototype.dimensionNodesInitiallyFlattened,
  showDimensionNodesCheckboxDisplayed: iDef(xavierOptions.showDimensionNodesCheckboxDisplayed) ? xavierOptions.showDimensionNodesCheckboxDisplayed : XmlaTreeView.prototype.showDimensionNodesCheckboxDisplayed,
  maxLowCardinalityLevelMembers: iDef(xavierOptions.maxLowCardinalityLevelMembers) ? xavierOptions.maxLowCardinalityLevelMembers : XmlaTreeView.prototype.maxLowCardinalityLevelMembers,
  defaultMemberDiscoveryMethod: iDef(xavierOptions.defaultMemberDiscoveryMethod) ? xavierOptions.defaultMemberDiscoveryMethod : XmlaTreeView.prototype.defaultMemberDiscoveryMethod,
  levelCardinalitiesDiscoveryMethod: iDef(xavierOptions.levelCardinalitiesDiscoveryMethod) ? xavierOptions.levelCardinalitiesDiscoveryMethod : XmlaTreeView.prototype.levelCardinalitiesDiscoveryMethod,
  urlRegExp: iRxp(xavierOptions.urlRegExp) ? xavierOptions.urlRegExp : XmlaTreeView.prototype.urlRegExp,
  checkIfDescriptionIsAnUrl: iFun(xavierOptions.checkIfDescriptionIsAnUrl) ? xavierOptions.checkIfDescriptionIsAnUrl : XmlaTreeView.prototype.checkIfDescriptionIsAnUrl,
  useDescriptionAsCubeCaption: iDef(xavierOptions.useDescriptionAsCubeCaption) ? xavierOptions.useDescriptionAsCubeCaption : XmlaTreeView.prototype.useDescriptionAsCubeCaption,
  listeners: {
    busy: function(){
      busy(true);
    },
    done: function(){
      busy(false);
    },
    error: function(xmlaTreeView, event, error){
      busy(false);
      showAlert("Unexpected Error", error.toString() || error.message);
      if (error.getStackTrace) {
        console.error(error.getStackTrace());
      }
    },
    loadCube: function(xmlaTreeView, event, cubeTreeNode){
      displayVisualizationsGroup(false);
    },
    cubeLoaded: function(xmlaTreeView, event){
      displayVisualizationsGroup(true);

      var currentCube = xmlaTreeView.getCurrentCube();
      workArea.setCube(currentCube);

      //see if we have to switch tab (selected tab must belong to current cube, or welcome tab)
      var selectedTab = workArea.getSelectedTab();
      var tabs = workArea.getTabsForCube(currentCube);

      //check if the current tab belongs to the current cube
      if (tabs.indexOf(pDec(selectedTab.id)) === -1) {
        //nope, so switch tabs.
        if (tabs.length) {  //we have at least one tab for this cube, so select it.
          selectedTab = tabs[0];
        }
        else {  //we don't have any tabs for this cube, then
          if (xavierOptions.autoCreateVisualization) {
            selectedTab = createVisualizationTab(xavierOptions.autoCreateVisualization);
          }
          else {
            selectedTab = workArea.getWelcomeTab();
          }
        }
        
        if (selectedTab) {
          workArea.setSelectedTab(selectedTab);
        }
      }
    },
    //called when an information icon is clicked.
    requestinfo: function(xmlaTreeView, event, data){
      workArea.newInfoTab(data);
    },
    nodeDoubleClicked: function(xmlaTreeView, event, data){
      var queryDesigner = workArea.getQueryDesigner();
      if (!queryDesigner) {
        return;
      }
      var treeNode = data.treeNode;
      var dragInfo = xmlaTreeView.checkStartDrag(treeNode);
      if (!dragInfo) {
        return;
      }
      var dropTarget = queryDesigner.findDropTarget(dragInfo);
      if (!dropTarget) {
        xmlaTreeView.notifyEndDrag(null, null);
        return;
      }
      dropTarget.axis.itemDropped(
        dropTarget.target,
        dragInfo
      );
      xmlaTreeView.notifyEndDrag(null, null);
    }
  }
});
app.xmlaTreeView = xmlaTreeView;

/**
*   Tabs (Workarea)
*/
var workArea = new XavierTabPane({
  dnd: dnd,
  xmla: xmla,
  xmlaTreeView: xmlaTreeView,
  xmlaMetadataFilter: xmlaMetadataFilter,
  autorun: getAutoRunEnabled(),
  listeners: {
    tabClosed: function(tabPane, event, data){
      if (tabPane.getSelectedTab() !== null) {
        return;
      }
      displayVisualizationActionsGroup(false);
    },
    tabSelected: function(tabPane, event, data){
      var tab = tabPane.getTab(data.newTab);

      var display = tab ? Boolean(tab.getVisualizer()) : false;
      displayVisualizationActionsGroup(display);

      tab.doLayout();

      //check if we have to select another cube in the treeview.
      if (tab.isForCube()) {
        var currentCube = xmlaTreeView.getCurrentCube();
        if (!tab.isForCube(currentCube)) {
          currentCube = tab.getMetadata();
          xmlaTreeView.loadCube(currentCube);
        }
      }
    }
  }
});
app.workArea = workArea;

/**
*   Main layout
*/
var mainSplitPane = new SplitPane({
  container: body,
  classes: ["mainsplitpane"],
  firstComponent: xmlaTreeView,
  secondComponent: workArea,
  orientation: SplitPane.orientations.vertical,
  style: {
    top: (mainToolbar ? 32 : 0) + "px"
  }
});
app.mainSplitPane = mainSplitPane;

mainSplitPane.listen("splitterPositionChanged", function(mainSplitPane, event, data){
  //tell the workArea to redo layout since its size has just changed.
  workArea.doLayout();
});

//force rendering
mainSplitPane.getDom();

var oldSplitterPosition = 300;
setTimeout(function(){
  mainSplitPane.setSplitterPosition(oldSplitterPosition + "px");
  windowResized();
  xmlaTreeView.collapseCube();
}, 200);

/**
*   Drag and drop stuff
*/
function startDrag(event, dndHandler) {
  var dragInfo;
  var queryDesigner = workArea.getQueryDesigner();
  if (!queryDesigner) {
    return false;
  }
  if (!
    (
      (dragInfo = xmlaTreeView.checkStartDrag(event, dndHandler))
    ||(dragInfo = (queryDesigner ? queryDesigner.checkStartDrag(event, dndHandler) : null))
    )
  ) {
    return false;
  }
  //todo: apply to the current querydesigner
  queryDesigner.highlightDropTargets(event.getTarget(), dragInfo);
  dndHandler.dragInfo = dragInfo;
  var proxy = dndHandler.dragProxy;
  proxy.innerHTML = dragInfo.label;
  var dragging = "dragging", className = dragging, i, classes = dragInfo.classes, n = classes.length;
  for (i = 0; i < n; i++){
    className += " " + classes[i] + "-" + dragging;
  }
  proxy.className = className;

  var proxyStyle = proxy.style;
  var xy = event.getXY();
  proxyStyle.left = (xy.x + 2) + "px";
  proxyStyle.top = (xy.y + 2) + "px";
  return true;
}

function whileDrag(event, dndHandler){
    var proxyStyle = dndHandler.dragProxy.style;
    var xy = event.getXY();
    proxyStyle.left = (xy.x + 2) + "px";
    proxyStyle.top = (xy.y + 2) + "px";

    var target = event.getTarget();
    var queryDesignerAxis = QueryDesignerAxis.lookup(target);

    var proxy = dndHandler.dropProxy;
    if (queryDesignerAxis && target.tagName !== "TABLE") {
      var dragInfo = dndHandler.dragInfo;
      var dom = queryDesignerAxis.getDom();
      var style = dom.style;

      var classToAdd, classToRemove, dropIndexes;
      if (queryDesignerAxis.canDropItem(target, dragInfo)) {
        //highlight the drop location
        var proxyStyle = proxy.style;
        proxyStyle.display = "block";
        var proxyClassName = QueryDesignerAxis.prefix + "-drop-target";
        var queryDesignerAxisDom = queryDesignerAxis.getDom();
        var queryDesignerAxisPos = pos(queryDesignerAxisDom);
        proxyClassName = proxyClassName + " " + proxyClassName + "-";
        var queryDesigner = queryDesignerAxis.getQueryDesigner();
        var layout = queryDesignerAxis.getLayout();
        var hierarchyIndex = queryDesignerAxis.getHierarchyIndex(
          queryDesignerAxis.getHierarchyName(dragInfo.metadata)
        );
        var row, rowPos, cell, cellPos;
        var el;
        if (hierarchyIndex === -1 || dragInfo.className === "hierarchy" || dragInfo.className === "measures") {
          //hierarchy does not exists yet.
          //Highlight the place where the new hierarchy would appear if dropped.
          proxyClassName += layout;
          switch (layout) {
            case QueryDesignerAxis.layouts.horizontal:
              row = target;
              row = gAnc(row, "TR");
              rowPos = pos(row);
              proxyStyle.height = "4px";
              proxyStyle.width = row.clientWidth + "px";
              proxyStyle.left = rowPos.left + "px";
              proxyStyle.top = (rowPos.top + row.clientHeight) + "px";
              break;
            case QueryDesignerAxis.layouts.vertical:
              cell = target;
              cell = gAnc(cell, "TD");
              cellPos = pos(cell);
              proxyStyle.height = queryDesignerAxisDom.clientHeight + "px";
              proxyStyle.top = queryDesignerAxisPos.top + "px";
              proxyStyle.width = "4px";
              proxyStyle.left = (cellPos.left + (cell.parentNode.rowIndex ? cell.clientWidth : 0)) + "px";
              break;
          }
        }
        else {
          //hierarchy exists.
          //Highlight the place where the new member would appear if dropped.
          cell = target;
          cell = gAnc(cell, "TD");
          row = cell.parentNode;
          proxyStyle.width = "4px";
          switch (layout) {
            case QueryDesignerAxis.layouts.horizontal:
              if (!row.rowIndex) {
                row = row.nextSibling;
              }
              row = queryDesignerAxisDom.rows[hierarchyIndex + 1];
              rowPos = pos(row);
              proxyStyle.top = rowPos.top + "px";
              proxyStyle.height = row.clientHeight + "px";
              if (cell.parentNode === row) {
                cellPos = pos(target);
                cellPos.left += target.offsetWidth;
              }
              else {
                if (cell.cellIndex) {
                  cell = (row.cells[1].children[queryDesignerAxis.getSetDefItemCount(hierarchyIndex) - 1]);
                  cellPos = pos(cell);
                  cellPos.left += cell.offsetWidth;
                }
                else {
                  cellPos = pos(cell);
                  cellPos.left += cell.clientWidth;
                }
              }
              proxyStyle.left = (cellPos.left) + "px";
              break;
            case QueryDesignerAxis.layouts.vertical:
              var itemsRow = queryDesignerAxisDom.rows[2];
              rowPos = pos(itemsRow);
              var itemsCell = itemsRow.cells[hierarchyIndex];
              cellPos = pos(itemsCell);
              proxyStyle.top = rowPos.top + "px";
              proxyStyle.height = row.clientHeight + "px";
              if (itemsRow === row && itemsCell === cell) {
                var targetPos = pos(target);
                proxyStyle.left = (targetPos.left + target.offsetWidth) + "px";
              }
              else {
                proxyStyle.left = cellPos.left + "px";
              }
              break;
          }
        }
        proxy.className = proxyClassName;
      }
    }
    else {
      proxy.className = "dnd-drop-proxy";
    }
    dnd.dropTargetAxis = queryDesignerAxis;
}

function endDrag(event, dndHandler) {
  var proxy = dndHandler.dragProxy;
  proxy.className = "dnd-drag-proxy";
  dndHandler.dropProxy.style.display = "none";

  if (dndHandler.dropTargetAxis) {
    dndHandler.dropTargetAxis.removeHighlight();
    dndHandler.dropTargetAxis = null;
  }
  //todo: apply to the current query designer
  var queryDesigner = workArea.getQueryDesigner();
  queryDesigner.unHighlightDropTargets();

  var target = event.getTarget();
  var queryDesignerAxis = QueryDesignerAxis.lookup(target);

  var dragInfo = dndHandler.dragInfo;
  if (dragInfo.dragOrigin === xmlaTreeView) {
    xmlaTreeView.notifyEndDrag(event, dndHandler);
    if (queryDesignerAxis && queryDesignerAxis.canDropItem(target, dragInfo)) {
      queryDesignerAxis.itemDropped(target, dragInfo);
    }
  }
  else
  if (dragInfo.dragOrigin === queryDesigner) {
    if (queryDesignerAxis) {
      if (dragInfo.queryDesignerAxis === queryDesignerAxis) {
        dragWithinAxis(dragInfo, queryDesignerAxis, target);
      }
      else
      if (queryDesignerAxis.canDropItem(target, dragInfo)) {
        dragFromAxisToOtherAxis(dragInfo, queryDesigner, queryDesignerAxis, target);
      }
    }
    else {
      dropOutsideAxis(dragInfo);
    }
  }
}

function dragWithinAxis(dragInfo, queryDesignerAxis, target){
  //drag and drop within same axis.
  if (dragInfo.isSortOption) {
    return;
  }
  switch (dragInfo.className){
    case "hierarchy":
    case "measures":
      var hierarchyIndex = queryDesignerAxis.getHierarchyIndexForTd(target);
      queryDesignerAxis.moveHierarchy(
        dragInfo.metadata,
        hierarchyIndex
      );
      break;
    case "member":
    case "member-drilldown":
    case "measure":
    case "level":
    case "property":
      queryDesignerAxis.moveMember(dragInfo.metadata, dragInfo.className, queryDesignerAxis.getMemberIndexForSpan(target));
      break;
  }
}

function dragFromAxisToOtherAxis(dragInfo, queryDesigner, queryDesignerAxis, target){
  //drag from and drop on another axis.
  switch (dragInfo.className) {
    case "hierarchy":
    case "measures":
      var hierarchyIndex = queryDesignerAxis.getHierarchyIndexForTd(target);
      queryDesigner.moveHierarchy(
        dragInfo.metadata,
        dragInfo.queryDesignerAxis,
        queryDesignerAxis,
        hierarchyIndex + 1
      );
      break;
    default:
      if (dragInfo.metadata === "query-designer-axis-header") {
        queryDesigner.swapAxes(dragInfo.queryDesignerAxis, queryDesignerAxis);
      }
  }
}

function dropOutsideAxis(dragInfo){
  //drop outside axis: remove the object.
  var queryDesignerAxis = dragInfo.queryDesignerAxis;
  switch (dragInfo.className) {
    case "hierarchy":
    case "measures":
      queryDesignerAxis.removeHierarchy(dragInfo.metadata);
      break;
    case "member":
    case "member-drilldown":
    case "measure":
    case "derived-measure":
    case "level":
    case "property":
      if (dragInfo.isSortOption) {
        queryDesignerAxis.setSortOption(null);
      }
      else {
        queryDesignerAxis.removeMember(dragInfo.metadata, dragInfo.className);
      }
      break;
    default:
      if (dragInfo.metadata === "query-designer-axis-header"){
        //an entire axis was dragged out.
        queryDesignerAxis.clear();
      }
  }
}

//Drag n drop support from tree to query editor.
dnd.listen({
  startDrag: startDrag,
  whileDrag: whileDrag,
  endDrag: endDrag
});

/**
*   Resize window stuff
*/
var resizeEvent = {
  factor: .33
};
function windowResized(){
  if (resizeEvent === null) {
    return;
  }
  xmlaTreeView.getSplitPane().setSplitterPosition((100 * resizeEvent.factor) + "%");
  workArea.doLayout();
  resizeEvent = null;
}
var resizeTimer = new Timer({
  delay: 100,
  listeners: {
    expired: windowResized
  }
});

listen(window, "resize", function(){
  if (resizeEvent === null) {
    resizeEvent = {
      factor: xmlaTreeView.getSplitPane().getSplitterRatio()
    };
  }
  resizeTimer.start();
});


function displayToolbarGroup(group, display){
  if (!mainToolbar) {
    return;
  }
  var groups = mainToolbar.groups, group = groups[group];
  if (!group) {
    return;
  }
  mainToolbar.displayGroup(group.name, display);  
}

function displayVisualizationsGroup(display){
  displayToolbarGroup("vis", display);
}

function displayVisualizationActionsGroup(display){
  displayToolbarGroup("visaction", display);
}
/**
 * Init:
 */
xmlaTreeView.init();

displayVisualizationsGroup(false);
displayVisualizationActionsGroup(false);

//toggleAutoRunEnabled();

linkCss(cssDir + "xavier.css");
var stylesheets = xavierOptions.stylesheets;
if (stylesheets){
  if (iStr(stylesheets)){
    stylesheets = [stylesheets];
  }
  var i = 0, n = stylesheets.length, stylesheet;
  for (i = 0; i < n; i++) {
    stylesheet = stylesheets[i];
    try {
      linkCss(stylesheet);
    }
    catch (e) {
      console.error("Error loading stylesheet " + stylesheet + ". " + e);
    }
  }
}

return this;
}
adopt(XavierApplication, Observable);

