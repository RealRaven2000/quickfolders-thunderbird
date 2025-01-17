var { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");
var QuickFolders_ESM = parseInt(AppConstants.MOZ_APP_VERSION, 10) >= 128;
var { MailServices } =
  QuickFolders_ESM
    ? ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs")
    : ChromeUtils.import("resource:///modules/MailServices.jsm");


Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders.js", window, "UTF-8");
window.QuickFolders.WL = WL; // this will be used wherever Add-on version is needed.
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-preferences.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-themes.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-filterWorker.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-util.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-interface.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-quickMove.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickmove-settings.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-bookmarks.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-model.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folderTree.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-folder-category.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-styles.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/quickfolders-tablistener.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://quickfolders/content/qf-scrollmenus.js", window, "UTF-8");

var mylisteners = {};
var toggleIcon, removeIcon;

async function onLoad(activatedWhileWindowOpen) {
  window.QuickFolders.Util.logDebug(
    `============INJECT==========\nqf-messenger.js onLoad(${activatedWhileWindowOpen})`
  );
  let layout = WL.injectCSS("chrome://quickfolders/content/quickfolders-layout.css");
  let layout2 = WL.injectCSS("chrome://quickfolders/content/quickfolders-tools.css");
  // layout.setAttribute("title", "QuickFolderStyles");

  // version specific:
  WL.injectCSS("chrome://quickfolders-skins/content/qf-current.css");

  let tb = WL.injectCSS("chrome://quickfolders/content/quickfolders-thunderbird.css");

  WL.injectCSS("chrome://quickfolders/content/skin/quickfolders-widgets.css");
  WL.injectCSS("chrome://quickfolders/content/quickfolders-filters.css");
  WL.injectCSS("chrome://quickfolders/content/quickfolders-mods.css");

  console.log("Adding QuickFolders toolbar ...");
  WL.injectElements(`

  <toolbox id="navigation-toolbox">
    <vbox id="titlebar">
      <toolbar
            id="QuickFolders-Toolbar"
            toolbarname="QuickFolders Toolbar"
            class="toolbar-primary contentTabToolbar quickFoldersToolbar"
            ondragover="(QuickFolders.toolbarDragObserver).dragOver(event);"
            ondrop="(QuickFolders.toolbarDragObserver).drop(event);"
            dragdroparea="QuickFolders-FoldersBox"
            customizable="false"
            context="QuickFolders-ToolbarPopup"
            flex="10" >
        <hbox id="QuickFolders-left" align="center">
          <vbox id="QuickFolders-LabelBox" flex="0">
            <toolbarbutton id="QuickFolders-title-label" 
                           oncommand="QuickFolders.Interface.clickTitleLabel(this);"
                                         label="__MSG_qf.label.quickfolders__" />
          </vbox>
        </hbox>
        
        <popupset id="QuickFolders-QuickMovePopupSet">
          <menupopup id="QuickFolders-quickMoveMenu">
            <menuitem id="QuickFolders-quickMove-suspend"
                      label="__MSG_quickfolders.quickMove.menu.suspend__"
                      oncommand="QuickFolders.quickMove.toggleSuspendMove(this);" 
                      type="checkbox"
                      />
            <menuitem id="QuickFolders-quickMove-cancel"
                      label="__MSG_quickfolders.quickMove.menu.cancel__"
                      oncommand="QuickFolders.quickMove.cancel();" 
                      collapsed="true"
                      />
            <menuitem id="QuickFolders-quickMove-showSearch"
                      label="__MSG_quickfolders.quickMove.menu.showSearch__"
                      oncommand="QuickFolders.quickMove.showSearch();" 
                      />
            <menuitem id="QuickFolders-quickMove-hideSearch"
                      label="__MSG_quickfolders.quickMove.menu.hideSearch__"
                      oncommand="QuickFolders.quickMove.hideSearch();" 
                      collapsed="true"
                      />
          </menupopup>
        </popupset>	
        
        <popupset id="QuickFolders-ReadingListPopupSet">
          <menupopup id="QuickFolders-readingListMenu" class="widerMenu">
            <menuitem id="QuickFolders-readingList-reset"
                      label="__MSG_quickfolders.readingList.clear__"
                                class="cmd"
                                collapsed="true"
                      oncommand="QuickFolders.bookmarks.resetList(true);" 
                      />
            <menuitem id="QuickFolders-readingList-add"
                      label="__MSG_quickfolders.readingList.addCurrent__"
                                class="cmd"
                      oncommand="QuickFolders.bookmarks.addCurrent();" 
                      />
          </menupopup>
        </popupset>	
        
        <popupset id="QuickFolders-MainPopupSet">
          <menupopup id="QuickFolders-ToolbarPopup">
            <!-- debug submenu -->
            <menu class="menu-iconic dbgMenu"  
                  collapsed="true"
                  id="QuickFolders-debug" 
                  label="Debug">
              <menupopup class="dbgMenu">
              
                <menuitem id="QuickFolders-ToolbarPopup-dbg0"
                  label="Lift up Navigation bar"
                  oncommand="QuickFolders.Interface.liftNavigationbar(window.gTabmail.currentTabInfo.chromeBrowser.contentDocument);" 
                  class="menuitem-iconic"
                  />

                <menuitem id="QuickFolders-ToolbarPopup-dbg1"
                  label="Set News flag"
                  oncommand="QuickFolders.Preferences.setBoolPref('hasNews', true); QuickFolders.Util.notifyTools.notifyBackground({ func: 'updateQuickFoldersLabel' });"
                  class="menuitem-iconic"
                  />                                      

                <menuitem id="QuickFolders-ToolbarPopup-dbg2"
                  label="Show Installation Popup"
                  oncommand="QuickFolders.Interface.viewInstalled();" 
                  class="cmd menuitem-iconic"
                  />                  

                <menuitem id="QuickFolders-ToolbarPopup-dbg3"
                  label="Copy current folder info!"
                  oncommand="QuickFolders.Interface.copyCurrentFolderInfo();"
                  class="menuitem-iconic"
                  />

                <menuitem id="QuickFolders-ToolbarPopup-dbg4"
                  label="Test Tree only Icons"
                  oncommand="QuickFolders.Interface.testTreeIcons();" 
                  class="menuitem-iconic"
                  />
                                      
                <menuitem id="QuickFolders-ToolbarPopup-dbg5"
                  label="Load FolderTree Dictionary"
                  oncommand="QuickFolders.FolderTree.loadDictionary.call(QuickFolders.FolderTree, QuickFolders.Util.document3pane);" 
                  class="menuitem-iconic"
                  />

                <menuitem id="QuickFolders-ToolbarPopup-dbg6"
                  label="Force Tree Refresh"
                  oncommand="QuickFolders.FolderTree.refreshTree.call(QuickFolders.FolderTree);" 
                  class="menuitem-iconic"
                  />
                    
                <menuitem id="QuickFolders-ToolbarPopup-dbg7"
                  label="Foldertree.init()"
                  oncommand="QuickFolders.FolderTree.init.call(QuickFolders.FolderTree);" 
                  class="menuitem-iconic"
                  />
                                  
                <menuitem id="QuickFolders-ToolbarPopup-dbg8"
                  label="Platform info - aboutHost()"
                  oncommand="QuickFolders.Util.aboutHost();"
                  class="menuitem-iconic"
                  />

                <menuitem id="QuickFolders-ToolbarPopup-dbg9"
                  label="Load Platform CSS"
                  oncommand="QuickFolders.Util.loadPlatformStylesheet();"
                  class="menuitem-iconic"
                  />

                <menuitem id="QuickFolders-ToolbarPopup-dbgA"
                  label="Focus thread pane."
                  oncommand="QuickFolders.Interface.setFocusThreadPane();"
                  class="menuitem-iconic"
                  />
                  
                                    
              </menupopup>
            </menu>
            <menuitem id="QuickFolders-ToolbarPopup-find"
                      label="__MSG_qf.menuitem.quickfolders.find__"
                      accesskey="__MSG_qf.menuitem.quickfolders.findAccess__"
                      oncommand="QuickFolders.Interface.findFolder(true,'quickJump');" 
                      class="cmd menuitem-iconic"
                      tagName="qfFindFolder"
                      collapsed="true"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-checkLicense"
                      label="__MSG_qf.menuitem.quickfolders.checkLicense__"
                      oncommand="QuickFolders.Interface.viewLicense();" 
                      class="cmd menuitem-iconic"
                      tagName="qfCheckLicense"
                      collapsed="true"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-options"
                      label="__MSG_qf.menuitem.quickfolders.options__"
                      accesskey="__MSG_qf.menuitem.quickfolders.optionsAccess__"
                      oncommand="QuickFolders.Interface.viewOptions(-1);" 
                      class="cmd menuitem-iconic"
                      tagName="qfOptions"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-splash"
                      label="__MSG_qf.menuitem.quickfolders.splash__"
                      oncommand="QuickFolders.Interface.viewSplash();" 
                      class="cmd menuitem-iconic"
                      tagName="qfSplash"
                      />
                      
            <menuitem id="QuickFolders-ToolbarPopup-filterMode"
                      label="__MSG_qf.menuitem.quickfolders.filters__"
                      accesskey="__MSG_qf.menuitem.quickfolders.filtersAccess__"
                      oncommand="QuickFolders.Interface.toggle_FilterMode(!QuickFolders.FilterWorker.FilterMode);"
                      class="cmd menuitem-iconic"
                      tagName="qfFilter"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-paintBucket"
                      label="__MSG_qf.menuitem.quickfolders.togglePaintMode__"
                      accesskey="__MSG_qf.menuitem.quickfolders.togglePaintModeAccess__"
                      oncommand="QuickFolders.Interface.togglePaintMode('toggle');"
                      class="cmd menuitem-iconic"
                      tagName="qfPaintBucket"
                      context="QuickFolders-Palette"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-changeOrder"
                      label="__MSG_qf.menuitem.quickfolders.changeOrder__"
                      accesskey="__MSG_qf.menuitem.quickfolders.changeOrderAccess__"
                      oncommand="QuickFolders.Interface.viewChangeOrder();"
                      class="cmd menuitem-iconic"
                      tagName="qfOrder"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-support"
                      label="__MSG_qf.menuitem.quickfolders.support__"
                      accesskey="__MSG_qf.menuitem.quickfolders.supportAccess__"
                      oncommand="QuickFolders.Interface.viewSupport();"
                      class="cmd menuitem-iconic"
                      tagName="qfSupport"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-help"
                      label="__MSG_qf.menuitem.quickfolders.help__"
                      accesskey="__MSG_qf.menuitem.quickfolders.helpAccess__"
                      oncommand="QuickFolders.Interface.viewHelp();" 
                      class="cmd menuitem-iconic"
                      tagName="qfHelp"
                      />
            <menuseparator />
            <menuitem id="QuickFolders-ToolbarPopup-refresh"
                      label="__MSG_qf.menuitem.quickfolders.repairTabs__"
                      accesskey="__MSG_qf.menuitem.quickfolders.repairTabsAccess__"
                      oncommand="QuickFolders.Util.notifyTools.notifyBackground({ func: 'updateMainWindow', minimal: false });" 
                      class="cmd menuitem-iconic"
                      tagName="qfRebuild"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-repair"
                      label="__MSG_qf.menuitem.quickfolders.repairTreeIcons__"
                      oncommand="QuickFolders.Interface.repairTreeIcons();" 
                      class="cmd menuitem-iconic"
                      tagName="qfRepairTreeIcons"
                      />
            <menuitem id="QuickFolders-ToolbarPopup-tidy"
                      label="__MSG_qf.menuitem.quickfolders.deleteDeadTabs__"
                      accesskey="__MSG_qf.menuitem.quickfolders.deleteDeadTabsAccess__"
                      oncommand="QuickFolders.Interface.tidyDeadFolders();" 
                      class="cmd menuitem-iconic"
                      tagName="qfTidyTabs"
                      />
            <menuseparator />
            <menuitem id="QuickFolders-ToolbarPopup-displayPreviewToolbar"
                      label="__MSG_qf.menuitem.quickfolders.displayPreviewToolbar__"
                      accesskey="__MSG_qf.menuitem.quickfolders.displayPreviewToolbarAccessKey__"
                      oncommand="QuickFolders.Interface.displayNavigationToolbar({display:true});"
                      class="cmd menuitem-iconic"
                      tagName="qfPreviewToolbar" 
                      />
            <menuitem id="QuickFolders-ToolbarPopup-register"
                      label="__MSG_qf.menuitem.quickfolders.register__"
                      oncommand="QuickFolders.Interface.showLicenseDialog('mainPopup');"
                      class="cmd menuitem-iconic free"
                      tagName="qfRegister"
                      />
          </menupopup>
        </popupset>


        <vbox id="QuickFolders-Folders-Pane"  flex="1">
          <box id="QuickFolders-FoldersBox" flex="1" class="folderBarContainer">
            <div class="QuickFolders-Empty-Toolbar-Label" crop="end">Initialising QuickFolders…</div>
          </box>
        </vbox>
      </toolbar>
    </vbox>
  </toolbox>
  `);

  //-----------------------------
  // search panel & mini toolbar in QF toolbar
  WL.injectElements(`
    
<hbox id="QuickFolders-left" style="align-items: stretch !important;">
  <vbox id="QuickFolders-Tools-Pane" insertafter="QuickFolders-LabelBox">
    <hbox id="QuickFolders-Category-Box"
              ondragenter="QuickFolders.buttonDragObserver.dragEnter(event)">
      <menulist id="QuickFolders-Category-Selection" 
                          oncommand="QuickFolders.Interface.selectCategory(this.value,false,this,event);" 
                          sizetopopup="none" 
                          collapsed="true">
        <menupopup>
            <!-- filled dynamically from JS -->
        </menupopup>
      </menulist>
      <hbox id="QuickFolders-oneButtonPanel">
        <toolbarbutton id="QuickFolders-mainPopup"
                       class="popupButton"
                       tooltiptext="__MSG_qf.tooltip.mainOptions__"
                       context="QuickFolders-ToolbarPopup"
                       onclick="QuickFolders.Interface.showPopup(this,'QuickFolders-ToolbarPopup',event);"/>
        <toolbarbutton id="QuickFolders-filterActive"
                       tooltiptext="__MSG_qf.tooltip.filters__"
                       oncommand="QuickFolders.Interface.toggle_FilterMode(false);"
                       collapsed="true"/>
        <toolbarbutton id="QuickFolders-paintBucketActive"
                       label="ABC"
                       tooltiptext="__MSG_qf.tooltip.paintCanActive__"
                       context="QuickFolders-PalettePopup" 
                       oncommand="QuickFolders.Interface.showPalette(this);"
                       collapsed="true"/>
        <toolbarbutton id="QuickFolders-readingList"
                       class="popupButton"
                       tooltiptext="__MSG_quickfolders.readingList.tooltip__"
                       label=""
                       onclick="QuickFolders.Interface.readingListClick(event,this);"
                       ondrop="QuickFolders.buttonDragObserver.drop(event);"
                       ondragenter="QuickFolders.buttonDragObserver.dragEnter(event);"
                       ondragover="QuickFolders.buttonDragObserver.dragOver(event);"
                       ondragleave="QuickFolders.buttonDragObserver.dragLeave(event);"
                       context="QuickFolders-readingListMenu"
                       collapsed="true"/>
        <toolbarbutton id="QuickFolders-quickMove"
                       class="popupButton"
                       tooltiptext="__MSG_qf.tooltip.quickMove__"
                       label=""
                       onclick="QuickFolders.Interface.quickMoveButtonClick(event,this);"
                       ondrop="QuickFolders.buttonDragObserver.drop(event);"
                       ondragenter="QuickFolders.buttonDragObserver.dragEnter(event);"
                       ondragover="QuickFolders.buttonDragObserver.dragOver(event);"
                       ondragleave="QuickFolders.buttonDragObserver.dragLeave(event);"
                       context="QuickFolders-quickMoveMenu"
                       />
        <search-textbox id="QuickFolders-FindFolder" 
                 onkeydown="QuickFolders.Interface.findFolderKeyDown(event);"
                 class="searchBox input-sizer"
                 type="search"
                 collapsed="true"
                 placeholder="__MSG_quickfolders.findFolder.placeHolder__"/>
        <toolbarbutton id="QuickFolders-FindFolder-Help"
                       class="popupButton"
                       label=""
                       tooltiptext="__MSG_quickfolders.findFolder.help__"
                       collapsed="true"
                       onclick="QuickFolders.Interface.quickMoveHelp(this);"
                       />
       </hbox>
       
      <popupset id="QuickFolders-Palette" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
        <menupopup id="QuickFolders-PalettePopup" 
                   class="QuickFolders-folder-popup" 
                             xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
                             onclick="QuickFolders.Interface.clickHandler(event,this);">
        </menupopup>
        <menupopup id="QuickFolders-FindPopup" 
                   class="menu-iconic widerMenu" 
                   position="after_start"
                   oncommand="QuickFolders.Interface.selectFound(this, event);"
                   onkeypress="QuickFolders.Interface.foundInput(this, event);"
                   onblur="QuickFolders.Interface.findPopupBlur(this, event);"
                   ignorekeys="false">
        </menupopup>
      </popupset>       
    </hbox>
  </vbox>
</hbox>
  `);

  // remove category to force selection when loading new version
  // [issue 279]
  window.QuickFolders.Interface.currentActiveCategories = window.QuickFolders.FolderCategory.INIT;

  const myToolbar = document.getElementById("QuickFolders-Toolbar");
  if (myToolbar) {
    // inject brighttext if necessary
    // for some reason this is not generated automatically
    // which leads to badly matching icons in the toolbar...
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      myToolbar.setAttribute("brighttext", true);
    }
  }
  const themeHandler = {
    handleEvent(event) {
      window.QuickFolders.Interface.patchToolbarTheme(event, {
        win: window,
        doc: document,
        toolbarId: "QuickFolders-Toolbar",
      });
    },
  };
  window.addEventListener("activate", themeHandler);
  window.addEventListener("windowlwthemeupdate", themeHandler);
  window.addEventListener("toolbarvisibilitychange", themeHandler);
  window.QuickFolders.themeHandler = themeHandler;

  // window.QuickFolders.initDocAndWindow(window);
  // [issue 378]
  /*
  let searchbox = document.getElementById("QuickFolders-FindFolder");
  if (searchbox) {
    // these child nodes are in #shadow-root!
    let searchInput = searchbox.querySelector("input");
    if (searchInput) {
      searchInput.addEventListener("input", searchbox.dataset.value = searchInput.value);
    }
  }
  */

  // [issue 534] leave search box open: allow dragging more maisls for quickMove
  const qm = myToolbar.querySelector("#QuickFolders-FindFolder");
  if (qm) {
    qm.addEventListener("dragenter", (e) => {
      return window.QuickFolders.buttonDragObserver.dragEnter(e);
    });
    qm.addEventListener("drop", (e) => {
      return window.QuickFolders.buttonDragObserver.drop(e);
    });
    qm.addEventListener("dragleave", (e) => {
      return window.QuickFolders.buttonDragObserver.dragLeave(e);
    });
  }

  // add listeners
  window.QuickFolders.Util.logDebug("Adding Folder Listener...");
  MailServices.mailSession.AddFolderListener(
    window.QuickFolders.FolderListener,
    Components.interfaces.nsIFolderListener.all
  );

  // call on background page to implement folder pane listener
  window.QuickFolders.Util.notifyTools.notifyBackground({ func: "addFolderPaneMenu" });

  // Thunderbird 115
  // iterate all mail tabs!
  window.gTabmail.tabInfo
    .filter((t) => t.mode.name == "mail3PaneTab")
    .forEach((tabInfo) => {
      const QuickFolders = window.QuickFolders;
      // const callBackCommands = tabInfo.chromeBrowser.contentWindow.commandController._callbackCommands;
      // backup wrapped functions:
      // callBackCommands.quickFilters_cmd_moveMessage = callBackCommands.cmd_moveMessage;
      // monkey foldertree patch drop method
      QuickFolders.patchFolderTree(tabInfo);
    });

  await window.QuickFolders.Util.init();
  if (window.QuickFolders.Util.versionGreaterOrEqual(window.QuickFolders.Util.Appversion, "102")) {
    WL.injectCSS("chrome://quickfolders/content/skin/qf-102.css");
  }
  window.QuickFolders.Util.notifyTools.notifyBackground({ func: "initActionButton" });

  window.QuickFolders.quickMove.initLog();
  window.addEventListener("QuickFolders.BackgroundUpdate", window.QuickFolders.initLicensedUI);
  const QI = window.QuickFolders.Interface;

  mylisteners["updateFoldersUI"] = QI.updateFoldersUI.bind(QI);
  mylisteners["updateAllTabs"] = QI.updateAllTabs.bind(QI);
  mylisteners["updateUserStyles"] = QI.updateUserStyles.bind(QI);
  mylisteners["updateNavigationBar"] = QI.updateNavigationBar.bind(QI);
  mylisteners["toggleNavigationBars"] = QI.displayNavigationToolbar.bind(QI);
  mylisteners["updateQuickFoldersLabel"] = QI.updateQuickFoldersLabel.bind(QI);
  mylisteners["updateCategoryBox"] = QI.updateCategoryLayout.bind(QI);
  mylisteners["copyFolderEntriesToClipboard"] = QI.copyFolderEntriesToClipboard.bind(QI);
  mylisteners["pasteFolderEntriesFromClipboard"] = QI.pasteFolderEntriesFromClipboard.bind(QI);
  // function parameters in event.detail
  mylisteners["updateMainWindow"] = (event) =>
    QI.updateMainWindow.call(QI, event.detail ? event.detail.minimal : null);
  mylisteners["currentDeckUpdate"] = QI.currentDeckUpdate.bind(QI);
  mylisteners["initKeyListeners"] = window.QuickFolders.initKeyListeners.bind(window.QuickFolders);
  mylisteners["firstRun"] = window.QuickFolders.Util.FirstRun.init.bind(
    window.QuickFolders.Util.FirstRun
  );
  mylisteners["toggleFolderTree"] = window.QuickFolders.Interface.toggleFolderTree.bind(
    window.QuickFolders.Interface
  );

  toggleIcon = (event) => {
    window.QuickFolders.Util.logDebug("listener_doCommand()", event.detail);
    let element = {
      id: "context-quickFoldersIcon",
    };
    window.QuickFolders.Interface.onSelectIcon(element, event.detail);
  };
  removeIcon = (event) => {
    window.QuickFolders.Util.logDebug("listener_doCommand()", event.detail);
    let element = {
      id: "context-quickFoldersRemoveIcon",
    };
    window.QuickFolders.Interface.onRemoveIcon(element, event.detail);
  };

  mylisteners["toggleQuickFoldersIcon"] = toggleIcon;
  mylisteners["removeQuickFoldersIcon"] = removeIcon;

  for (let m in mylisteners) {
    window.addEventListener(`QuickFolders.BackgroundUpdate.${m}`, mylisteners[m]);
  }
  // make sure we do not get our install stuff _before_ our listeners are ready!!
  window.QuickFolders.Util.notifyTools.notifyBackground({ func: "listenersReady" });

  window.QuickFolders.initDelayed(WL); // should call updateMainWindow!
}

function onUnload(isAddOnShutDown) {
  let isError = false;
  // Disable the global notify notifications from background.
  window.QuickFolders.Util.notifyTools.removeAllListeners();
  try {
    window.removeEventListener("QuickFolders.BackgroundUpdate", window.QuickFolders.initLicensedUI);
  } catch (ex) {
    console.error(`QuickFolders - Error removing BackgroundUpdate listener:`, ex, window);
    isError = true;
  }

  for (let m in mylisteners) {
    try {
      window.removeEventListener(`QuickFolders.BackgroundUpdate.${m}`, mylisteners[m]);
      window.QuickFolders.Util.logDebugOptional("events", `Successfully removed listener for ${m}`);
    } catch (ex) {
      console.error(`QuickFolders - Error removing listener for ${m}:`, ex);
      isError = true;
    }
  }

  // tidy up key listener!
  try {
    if (window.QuickFolders.keyListen) {
      window.QuickFolders.removeKeyListeners.call(window.QuickFolders, window);
      delete window.QuickFolders.keyListen;
    }
  } catch (ex) {
    console.error(`QuickFolders - Error removing key listener:`, ex, window);
    isError = true;
  }

  // if quickFilters buttons are in the UI, move them back to the hidden panel in the toolbar!
  function stashQuickFiltersButton(id, toParent) {
    let el = document.getElementById(id);
    if (el) {
      toParent.appendChild(el);
    }
  }
  try {
    let stashBox = document.getElementById("quickFilters-injected");
    if (stashBox) {
      stashQuickFiltersButton("quickfilters-current-listbutton", stashBox);
      stashQuickFiltersButton("quickfilters-current-searchfilterbutton", stashBox);
      stashQuickFiltersButton("quickfilters-current-runbutton", stashBox);
      stashQuickFiltersButton("quickfilters-current-msg-runbutton", stashBox);
    }
  } catch (ex) {
    console.error(`QuickFolders - Error stashing quickFilters buttons:`, ex);
    isError = true;
  }

  // remove all listeners
  try {
    window.QuickFolders.Interface.removeToolbarHiding.call(window.QuickFolders.Interface);
    MailServices.mailSession.RemoveFolderListener(window.QuickFolders.FolderListener);
    window.QuickFolders.removeTabEventListener.call(window.QuickFolders);
    //  window.QuickFolders.removeFolderPaneListener.call(window.QuickFolders);
  } catch (ex) {
    console.error("QuickFolders - remove remaining listener failed", ex);
    isError = true;
  }
  try {
    window.removeEventListener("activate", window.QuickFolders.themeHandler);
    window.removeEventListener("windowlwthemeupdate", window.QuickFolders.themeHandler);
    window.removeEventListener("toolbarvisibilitychange", window.QuickFolders.themeHandler);
  } catch (ex) {
    console.error("QuickFolders - removing theme event handler failed", ex);
    isError = true;
  }
  if (!isError & window.QuickFolders.Preferences.isDebug) {
    window.QuickFolders.Util.logHighlight("onUnload executed without throwing errors", {
      color: "lightyellow",
      background: "#00CC99",
    });
  }
}
