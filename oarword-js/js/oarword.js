/**
 * Created with JetBrains WebStorm.
 * Author: airxiechao@gmail.com
 * Date: 13-6-26
 * Time: 下午1:27
 */
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.events.ImeHandler');
goog.require('goog.fx.Dragger');
goog.require('goog.editor.Table');
goog.require('goog.dom.ViewportSizeMonitor');

goog.require('goog.ui.Menu');
goog.require('goog.ui.menuBar');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Option');
goog.require('goog.ui.ToolbarSelect');
goog.require('goog.ui.MenuSeparator');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarMenuButton');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarToggleButton');
goog.require('goog.ui.ToolbarSeparator');

goog.require('goog.ui.ToolbarColorMenuButton');
goog.require('goog.ui.ToolbarColorMenuButtonRenderer');
goog.require('goog.ui.ColorMenuButton');
goog.require('goog.ui.ColorMenuButtonRenderer');
goog.require('goog.ui.CustomColorPalette');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.FlatMenuButtonRenderer');

goog.require('goog.ui.Dialog');
goog.require('goog.ui.DimensionPicker');
goog.require('goog.ui.SubMenu');
goog.require('goog.net.XhrIo');
goog.require('goog.net.IframeIo');
goog.require('goog.ui.tree.TreeControl');

var G = {};

function main() {
    var container = G.container = goog.dom.getElement('oar-container');
    var titlebar = goog.dom.getElement('oar-titlebar');
    var titlebarIn = false;
    container.style.height = window.innerHeight - 120 + 'px';

    var menubar = G.menubar = new Menubar();
    var toolbar = G.toolbar = new Toolbar();
    var cursor = G.cursor = new Cursor();
    var inputbox = G.inputbox = new InputBox();
    var history = G.history = new ActionHistory();
    var rangeSelector = G.rangeSelector = new RangeSelector();

    var vsm = new goog.dom.ViewportSizeMonitor();
    goog.events.listen(vsm, goog.events.EventType.RESIZE, function(e) {
        G.container.style.height = (vsm.getSize().height - 120) + 'px';
        for( var i in G.doc.childrenEle ) {
            if(G.doc.childrenEle[i].className == 'oar-page' ) {
                G.doc.childrenEle[i].style.marginLeft = (G.doc.offsetWidth - Page.fixedWidth ) / 2 + 'px'
            }
        }
        G.cursor.refreshTarget();
    });

    goog.events.listen(titlebar, goog.events.EventType.CLICK, function(e) {
        if( titlebarIn == false ) {
            titlebarIn = true;
            var titleInput = goog.dom.createDom('input');
            titleInput.type = 'text';
            titleInput.value = titlebar.textContent;
            titlebar.textContent = '';
            titleInput.style.height = '21px';
            titleInput.style.border = '0';
            titleInput.style.outline = '0px';
            titleInput.style.paddingLeft = '3px';
            titleInput.style.fontFamily = 'Arial';
            //titleInput.style.fontWeight = 'bold';
            titleInput.style.fontSize = '17px';
            goog.dom.appendChild(titlebar, titleInput);
            titleInput.focus();

            goog.events.listen(titleInput, goog.events.EventType.KEYUP, function(e) {
                titlebarIn = false;
                if(e.keyCode == 13){
                    titlebar.textContent = titleInput.value;
                    goog.dom.removeNode(titleInput);

                    var xhr = new goog.net.XhrIo();
                    xhr.send(config.appbase + '/NewFileName?file='+titlebar.textContent, 'GET');
                }
            });

            goog.events.listen(titleInput, goog.events.EventType.BLUR, function(e) {
                titlebarIn = false;
                titlebar.textContent = titleInput.value;
                goog.dom.removeNode(titleInput);
            });
        }
    });

    goog.events.listen(document.body, goog.events.EventType.CONTEXTMENU, function(e) {
        e.preventDefault();
        return false;
    });

    var doc = G.doc = new Doc();
    goog.dom.appendChild(container, doc);
    goog.dom.appendChild(container, cursor);
    goog.dom.appendChild(container, inputbox);
    goog.dom.appendChild(container, rangeSelector);

    var page = new Page();
    doc.appendPage(page);

    var line = page.childrenEle[0].childrenEle[0];

    line.handleLineAlign();
    G.cursor.setTarget(line.childrenEle[0], new ILH(0,0,line.childrenEle[0].offsetHeight));
    inputbox.focus();
}
//----------------------------------------------------------------------------------------------------------------------
// global utils functions
// hex color to rgb
function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)};
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)};
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)};
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h};

function isColorEqual(c1, c2) {
    if( c1.charAt(0) == '#' ) {
        c1 = cutHex(c1);
        var R = hexToR(c1);
        var G = hexToG(c1);
        var B = hexToB(c1);

        c1 = 'rgb(' + R + ', ' + G + ', ' + B +  ')';
    }
    if( c2.charAt(0) == '#' ) {
        c2 = cutHex(c2);
        var R = hexToR(c2);
        var G = hexToG(c2);
        var B = hexToB(c2);

        c2 = 'rgb(' + R + ', ' + G + ', ' + B +  ')';
    }

    return c1 == c2;
}

function asse(ele, f) {
    for( var i in f ) {
        ele[i] = f[i];
    }
}

function getContainerOffset(ele) {
    var left = 0, top = 0;

    while( ele ) {
        left += ele.offsetLeft;
        top += ele.offsetTop;
        ele = ele.offsetParent;
        if( ele && ele.id == 'oar-container' ) {
            break;
        }
    }

    return {left:left, top:top};
}

function measureFontTextWH(text, fontFamily, fontSize, fontWeight){
    var dummy = goog.dom.createDom('span');
    dummy.style.fontFamily = fontFamily;
    dummy.style.fontSize = fontSize;
    dummy.style.fontWeight = fontWeight;
    dummy.textContent = text;
    dummy.visibility = 'hidden';

    goog.dom.appendChild(document.body, dummy);
    var w = dummy.offsetWidth;
    var h = dummy.offsetHeight;
    goog.dom.removeNode(dummy);
    return {w:w, h:h};
}

function sendNewFileName(title) {
    var xhr = new goog.net.XhrIo();
    xhr.send(config.appbase + '/NewFileName?file='+title, 'GET');
}

function getComputedFontStyle(ele) {
    var fontFamily = goog.style.getComputedStyle(ele, 'font-family');
    var fontSize = goog.style.getComputedStyle(ele, 'font-size');
    var bold = goog.style.getComputedStyle(ele, 'font-weight');
    var italic = goog.style.getComputedStyle(ele, 'font-style');

    return {family: fontFamily, size: fontSize, weight: bold, style: italic };
}

function traverseCellToXmlNode(cell, nodeX, preX) {
    var ptaX = null;
    var usePTAXPre = false;

    if( preX != null ) {
        ptaX = preX;
        usePTAXPre = true;
    }

    for( var gi = 0; gi < cell.childrenEle.length; ++gi ) {
        var pta = cell.childrenEle[gi];

        if( pta.className == 'oar-paragraph') {
            // paragraph
            var paraX = null;
            if( usePTAXPre && ptaX.tagName.toLowerCase() == 'paragraph' ) {
                paraX = ptaX;
            } else {
                paraX = document.createElement('paragraph');
                paraX.setAttribute('align', pta.getParagraphStyle().align);
                ptaX = null;
                usePTAXPre = false;
            }

            nodeX.appendChild(paraX);
            for( var li = 0; li < pta.childrenEle.length; ++li ) {
                var line = pta.childrenEle[li];
                if( line.className == 'oar-line' ) {
                    for( var bi = 0; bi < line.childrenEle.length; ++bi ) {
                        var inline = line.childrenEle[bi];
                        if( inline.className == 'oar-inline-block' ) {
                            // text
                            var textX = document.createElement('text');
                            paraX.appendChild(textX);

                            // text style
                            var textStyleX = document.createElement('style');
                            textX.appendChild(textStyleX);

                            var ts = inline.getBlockStyle();
                            textStyleX.setAttribute('font-family', ts.fontFamily.replace(/'/g, ''));
                            textStyleX.setAttribute('font-size', parseInt(ts.fontSize) + '');
                            textStyleX.setAttribute('font-weight', ts.fontWeight);
                            textStyleX.setAttribute('font-style', ts.fontStyle);
                            textStyleX.setAttribute('color', ts.color);
                            textStyleX.setAttribute('background-color', ts.backgroundColor);
                            textStyleX.setAttribute('text-decoration', ts.textDecoration);
                            textStyleX.setAttribute('script', ts.script);

                            // text content
                            var textContentX = document.createElement('content');
                            var tX = document.createTextNode(inline.textContent.replace(/\u00a0/g, " "));
                            textContentX.appendChild(tX);
                            textX.appendChild(textContentX);
                        } else if( inline.className == 'oar-inline-image' ) {
                            // images
                            var img = inline.getElementsByClassName('oar-inline-image-content')[0];
                            var drawingX = document.createElement('drawing');
                            paraX.appendChild(drawingX);

                            // image style
                            var drawingStyleX = document.createElement('style');
                            drawingX.appendChild(drawingStyleX);
                            drawingStyleX.setAttribute('width', img.offsetWidth);
                            drawingStyleX.setAttribute('height', img.offsetHeight);

                            // text content
                            var drawingContentX = document.createElement('content');
                            var tX = document.createTextNode(img.src);
                            drawingContentX.appendChild(tX);
                            drawingX.appendChild(drawingContentX);
                        }
                    }
                }
            }

            var ll = pta.childrenEle[pta.childrenEle.length - 1];
            var lb = ll.childrenEle[ll.childrenEle.length - 1];

            if( lb.className == 'oar-inline-eop' ) {
                usePTAXPre = false;
                ptaX = null;
            } else {
                usePTAXPre = true;
                ptaX = paraX;
            }
        } else if( pta.className == 'oar-table' ) {
            // table
            var tableX = null;
            if( usePTAXPre && ptaX.tagName.toLowerCase() == 'table' ) {
                tableX = ptaX;
            } else {
                tableX = document.createElement('table');
                ptaX = null;
                usePTAXPre = false;
            }

            nodeX.appendChild(tableX);
            for( var ri = 0; ri < pta.rows.length; ++ri ) {
                // table row
                var row = pta.rows[ri];
                var rowX = document.createElement('row');
                rowX.setAttribute('height', row.offsetHeight);
                tableX.appendChild(rowX);
                var cpreX = null;

                for( var ci = 0; ci < row.cells.length; ++ci ) {
                    // table row cell
                    var cell2 = row.cells[ci].getElementsByClassName('oar-pta-cell')[0];

                    var cellX = document.createElement('cell');
                    rowX.appendChild(cellX);
                    cellX.setAttribute('width', row.cells[ci].offsetWidth);

                    var rspan = row.cells[ci].rowSpan ? row.cells[ci].rowSpan : 1;
                    var cspan = row.cells[ci].colSpan ? row.cells[ci].colSpan : 1;
                    cellX.setAttribute('colspan', cspan);
                    cellX.setAttribute('rowspan', rspan);

                    // traverse table cells
                    cpreX = traverseCellToXmlNode(cell2, cellX, cpreX);
                }
            }

            // adjust for docx table
            var trs = tableX.getElementsByTagName('row');
            for( var tri = 0; tri < trs.length; ++tri ) {
                var tr = trs[tri];
                var ces = tr.getElementsByTagName("cell");
                for( var cei = 0; cei < ces.length; ++cei ) {
                    var ce = ces[cei];

                    var orspan = parseInt(ce.getAttribute('rowspan'));
                    for( var orsi = 1; orsi < orspan; ++orsi ) {
                        var ttr = trs[tri + orsi];
                        var tce = ttr.getElementsByTagName("cell")[cei];
                        var tcerspan = tce.getAttribute('rowspan');
                        if( tcerspan == 0 ) {
                            continue;
                        }

                        var nce = document.createElement('cell');
                        nce.setAttribute('width', ce.getAttribute('width'));
                        nce.setAttribute('colspan', ce.getAttribute('colspan'));
                        nce.setAttribute('rowspan', 0);

                        var ncePara = document.createElement('paragraph');
                        ncePara.setAttribute('align', 'left');
                        nce.appendChild(ncePara);

                        if( tce ) {
                            ttr.insertBefore(nce, tce);
                        } else {
                            ttr.appendChild(nce);
                        }
                    }
                }
            }
            usePTAXPre = true;
            ptaX = tableX;
        }
    }

    return ptaX;
};

function loadFromNode(pc, root) {
    // pc : page or cell
    for( var pti = 0; pti < root.childNodes.length; ++pti ) {
        var pt = root.childNodes[pti];

        if( pt.tagName == 'paragraph' ) {
            var p = new Paragraph();
            var pAlign = pt.getAttribute('align');
            p.getParagraphStyle().align = pAlign;
            pc.appendPTA(p);

            for( var bi = 0; bi < pt.childNodes.length; ++bi ) {
                var inline = pt.childNodes[bi];
                var l = p.childrenEle[p.childrenEle.length - 1];
                var lb = l.childrenEle[l.childrenEle.length - 1];
                var block = null;

                if( inline.tagName == 'text' ) {
                    block = new InlineBlock();

                    var textStyle = inline.getElementsByTagName('style')[0];
                    var textContent = inline.getElementsByTagName('content')[0];

                    var textFontFamily = textStyle.getAttribute('font-family');
                    var textFontSize = textStyle.getAttribute('font-size');
                    var textFontWeight = textStyle.getAttribute('font-weight');
                    var textFontStyle = textStyle.getAttribute('font-style');
                    var textTextDecoration = textStyle.getAttribute('text-decoration');
                    var textColor = textStyle.getAttribute('color');
                    var textBackgroundColor = textStyle.getAttribute('background-color');
                    var textScript = textStyle.getAttribute('script');
                    var blockStyle = new BlockStyle(textFontFamily, textFontSize, textColor);
                    blockStyle.backgroundColor = textBackgroundColor;
                    blockStyle.fontWeight = textFontWeight;
                    blockStyle.fontStyle = textFontStyle;
                    blockStyle.textDecoration = textTextDecoration;
                    blockStyle.setScript(textScript);

                    if( parseInt(textFontSize) ) {
                        blockStyle.fontSize = parseInt(textFontSize) + 'px';
                    }

                    block.setBlockStyle(blockStyle);
                    block.textContent = textContent.textContent;
                } else if( inline.tagName == 'drawing' ) {
                    block = new InlineImage();

                    var imgStyle = inline.getElementsByTagName('style')[0];
                    var imgContent = inline.getElementsByTagName('content')[0];
                    var imgStyleHeight = imgStyle.getAttribute('height');
                    var imgStyleWidth = imgStyle.getAttribute('width');

                    block.setSource(imgContent.textContent);
                    block.image.style.width = imgStyleWidth + 'px';
                    block.image.style.height = imgStyleHeight + 'px';

                }

                if( lb.className == 'oar-inline-eop' ) {
                    l.insertBlockBefore(block, lb);
                    l.handleLineAlign();
                    l.handleOverflow();
                }
            }


            if( pc.className == 'oar-page' ) {
                pc.handleOverflow();

                pc = G.doc.childrenEle[G.doc.childrenEle.length - 1];
            }
        } else if( pt.tagName == 'table' ) {
            var tbl = new Table(1, 1);
            pc.appendPTA(tbl);

            for(var ri = 0; ri < pt.childNodes.length; ++ri) {
                var row = pt.childNodes[ri];
                var rowHeight = row.getAttribute('height');
                if( ri > 0 ) {
                    var r = goog.dom.createDom('tr');
                    goog.dom.insertSiblingAfter( r, tbl.rows[ri - 1]);
                }
                tbl.rows[ri].style.height = rowHeight + 'px';

                var cci = 0;
                for( var ci = 0; ci < row.childNodes.length; ++ci ) {
                    var cell = row.childNodes[ci];
                    var colWidth = cell.getAttribute('width');
                    var rspan = cell.getAttribute('rowspan');
                    var cspan = cell.getAttribute('colspan');

                    if( parseInt(rspan) == 0 ) {
                        continue;
                    }

                    var c = null;
                    if( ri == 0 && cci == 0 ) {
                        var td = tbl.rows[0].cells[0];
                        td.style.verticalAlign = 'top';
                        td.rowSpan = rspan;
                        td.colSpan = cspan;
                        td.style.width = colWidth + 'px';
                        c = td.getElementsByClassName('oar-pta-cell')[0];

                    } else {
                        c = new PTACell();
                        var td = goog.dom.createDom('td');
                        td.style.verticalAlign = 'top';
                        td.textContent = '';
                        td.rowSpan = rspan;
                        td.colSpan = cspan;
                        td.style.width = colWidth + 'px';
                        goog.dom.appendChild(td, c);

                        if( tbl.rows[ri].cells[cci - 1] ) {
                            goog.dom.insertSiblingAfter( td, tbl.rows[ri].cells[cci-1] );
                        } else {
                            goog.dom.appendChild(tbl.rows[ri], td);
                        }
                    }

                    if( c && c.className == 'oar-pta-cell' ) {
                        c.removePTA(c.childrenEle[c.childrenEle.length - 1]);
                        loadFromNode(c, cell);
                    }

                    cci++;
                }
            }
        }
    }
};

//---------------------------------------------------------------------------------------------------------------------- menubar
var Menubar = function() {
    var menubar = goog.ui.menuBar.create();
    var menuNames = ["文件", "编辑", "插入", "表格"];

    var menuOptions = [];
    menuOptions[0] = ['新建', '打开',null,'下载','打印预览', null, '退出'];
    menuOptions[1] = ['撤销','重做',null,'剪切','复制', '粘贴'];
    menuOptions[2] = ['表格','图片'];
    menuOptions[3] = ['插入表格', null, '在上方插入', '在下方插入','在左侧插入','在右侧插入',null,
        '合并单元格','拆分单元格',null,'删除行','删除列','删除表格'];

    var menuAcce = [];
    menuAcce[0] = [];
    menuAcce[1] = ['Ctrl+Z', 'Ctrl+Y',null,'Ctrl+X','Ctrl+C','Ctrl+V'];

    for (var i in menuNames) {
        // Create the drop down menu with a few suboptions.
        var menu = new goog.ui.Menu();
        var j = -1;
        goog.array.forEach(menuOptions[i],
            function(label) {
                var item;
                j++;
                if (label) {
                    if( ( i == 2 && label == '表格') || (i == 3 && label == '插入表格') ){
                        var dimensionPicker = new goog.ui.DimensionPicker();

                        goog.events.listen(dimensionPicker, goog.ui.Component.EventType.ACTION,
                            function(e) {
                                var picker = e.target;
                                var size = picker.getValue();
                                G.cursor.addTable(size);
                            });

                        item = new goog.ui.SubMenu(label);
                        item.addItem(dimensionPicker);
                        item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
                        menu.addChild(item, true);
                    } else {
                        item = new goog.ui.MenuItem(label + '');
                        item.setId(label);
                        item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
                        menu.addChild(item, true);

                        if( menuAcce[i] && menuAcce[i][j] ) {
                            var acc = goog.dom.createDom('span');
                            acc.textContent = menuAcce[i][j];
                            acc.className = 'goog-menuitem-accel';
                            item.getContentElement().appendChild(acc);
                        }
                    }
                } else {
                    item = new goog.ui.MenuSeparator();
                    item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
                    menu.addChild(item, true);
                }


                goog.events.listen(item, goog.ui.Component.EventType.ACTION, function(e){
                    var id = this.getId();
                    if(id == '在上方插入' ){
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            var crc = table.getCellRC(cell);
                            table.insertRow(crc.row);
                        }
                    } else if( id == '在下方插入' ) {
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            var crc = table.getCellRC(cell);
                            table.insertRow(crc.row + 1);
                        }
                    } else if( id == '在左侧插入' ) {
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            var crc = table.getCellRC(cell);
                            table.insertCol(crc.col);
                        }
                    } else if( id == '在右侧插入' ) {
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            var crc = table.getCellRC(cell);
                            table.insertCol(crc.col + 1);
                        }
                    } else if( id == '删除行' ) {
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            var crc = table.getCellRC(cell);
                            table.removeRow(crc.row);
                        }
                    } else if( id == '删除列' ) {
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            var crc = table.getCellRC(cell);
                            table.removeCol(crc.col);
                        }
                    } else if( id == '删除表格' ) {
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            var tCell = goog.dom.getParentElement(table);

                            var oldCursorP = getContainerOffset(G.cursor.target.inline);
                            oldCursorP.left += G.cursor.target.ilh.l;

                            tCell.removePTA(table);

                            var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
                            G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
                        }
                    } else if( id == '合并单元格' ) {
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            // find dimension
                            if( G.rangeSelector.foLine != null ) {
                                // line in table
                                var para = goog.dom.getParentElement(G.rangeSelector.foLine);
                                var cell = goog.dom.getParentElement(para);
                                var pc = goog.dom.getParentElement(cell);
                                var nextLine = G.rangeSelector.foLine;

                                var srow = -1;
                                var scol = -1;
                                var erow = -1;
                                var ecol = -1;
                                var mrow = -1;
                                var mcol = -1;

                                if( pc.tagName.toLowerCase() == 'td' ) {
                                     for( var ri = 0; ri < table.rows.length; ++ri ) {
                                         for( var ci = 0; ci < table.rows[ri].cells.length; ++ci ) {
                                             var itd = table.rows[ri].cells[ci];
                                             var icell = itd.getElementsByClassName('oar-pta-cell')[0];

                                             if(icell.hasTopOverlay()) {
                                                if( srow == -1 ) {
                                                    srow = ri;
                                                    scol = ci;
                                                } else {
                                                    erow = ri;
                                                    ecol = ci;
                                                }
                                             }
                                         }

                                    }
                                }

                                if( srow != -1 ) {
                                    // clear overlay
                                    G.rangeSelector.clearRangeOverlay();

                                    table.mergeCells(
                                        Math.min(srow,erow),Math.min(scol,ecol),
                                        Math.max(srow,erow),Math.max(scol,ecol)
                                    );

                                    mrow = Math.min(srow,erow);
                                    mcol = Math.min(scol,ecol);

                                    var mtd = table.rows[mrow].cells[mcol];
                                    var mcells = mtd.getElementsByClassName('oar-pta-cell');

                                    // merge cells in td
                                    for( var mi = 0; mi < mcells.length; ++mi ) {
                                        if( mi > 0 ) {
                                            for( var mcci = 0; mcci < mcells[mi].childrenEle.length; ++mcci ) {
                                                var mcpt = mcells[mi].childrenEle[mcci];
                                                mcells[mi].removePTA(mcpt);
                                                mcells[0].appendPTA(mcpt);
                                            }

                                            goog.dom.removeNode(mcells[mi]);
                                            --mi;
                                        }
                                    }

                                    G.cursor.refreshTarget();
                                }
                            }
                        }
                    } else if( id == '拆分单元格' ) {
                        var target = G.cursor.target.inline;
                        var lineC = goog.dom.getParentElement(target);
                        var line = goog.dom.getParentElement(lineC);
                        var para = goog.dom.getParentElement(line);
                        var cell = goog.dom.getParentElement(para);
                        var cc = goog.dom.getParentElement(cell);

                        if( cc.tagName.toLowerCase() == 'td' ) {
                            var table = cc;
                            do {
                                table = goog.dom.getParentElement(table);
                            } while( table.tagName.toLowerCase() != 'table' );

                            var srow = -1;
                            var scol = -1;
                            var srspan = 0;
                            var scspan = 0;

                            // find the row and col
                            forrowcol:
                            for( var ri = 0; ri < table.rows.length; ++ri ) {
                                for( var ci = 0; ci < table.rows[ri].cells.length; ++ci ) {
                                    var itd = table.rows[ri].cells[ci];

                                    if( itd == cc ) {
                                        srow = ri;
                                        scol = ci;
                                        srspan = itd.rowSpan;
                                        scspan = itd.colSpan;
                                        break forrowcol;
                                    }
                                }
                            }

                            if( srow != -1 ) {
                                table.splitCell(srow,scol);

                                // ajust cells
                                for( var irs = srow; irs < srow + srspan; ++irs ) {
                                    for( var ics = scol; ics < scol + scspan; ++ics ) {
                                        var irctd = table.rows[irs].cells[ics];
                                        irctd.style.verticalAlign = 'top';
                                        irctd.style.padding = '4px';
                                    }
                                }

                                G.cursor.refreshTarget();
                            }

                        }
                    } else if( id == '图片' ) {
                        var insertImgDialog = new InsertImgDialog();
                        insertImgDialog.setVisible(true);
                    } else if( id == '撤销' ) {
                        G.history.undo();
                    } else if( id == '重做' ) {
                        G.history.redo();
                    } else if( id == '下载' ) {
                        var downloadDlg = new DownloadDialog();
                        downloadDlg.setVisible(true);
                    } else if( id == '打印预览' ) {
                        var pvDialog = new PrintViewDialog();
                        pvDialog.setVisible(true);
                        pvDialog.run();
                    }else if( id == '剪切' ) {
                        G.rangeSelector.cutBlocksInRange();
                    }else if( id == '复制' ) {
                        G.rangeSelector.copyBlocksInRange();
                    }else if( id == '粘贴' ) {
                        if(G.copySet && G.copySet.length > 0 ) {
                            G.doc.pasteBlocks(G.copySet);
                        }
                    } else if(id == '新建') {
                        var newFileDialog = new NewFileDialog();
                        newFileDialog.setVisible(true);
                    }else if( id == '退出' ){
                        //window.open('', '_self', '');
                        //window.close();
                        window.location = 'index.html';
                    } else if( id == '打开' ) {
                        var openFileDialog = new OpenFileDialog();
                        openFileDialog.setVisible(true);
                        /*
                        var uploadForm = goog.dom.createDom('form');
                        uploadForm.action = 'upload';
                        uploadForm.method = 'POST';
                        uploadForm.enctype = 'multipart/form-data';

                        var uploadFileInput = goog.dom.createDom('input');
                        uploadFileInput.type = 'file';
                        uploadFileInput.name = 'file';
                        uploadForm.appendChild(uploadFileInput);

                        var uploadBtn = goog.dom.createDom('input');
                        uploadBtn.type = 'button';
                        uploadBtn.value = '上传';
                        uploadForm.appendChild(uploadBtn);

                        goog.dom.getElement('oar-titlebar').appendChild(uploadForm);

                        var iframeIO = new goog.net.IframeIo();
                        goog.events.listen(uploadBtn, goog.events.EventType.CLICK, function(e) {
                            iframeIO.sendFromForm(uploadForm, 'upload');
                        });

                        goog.events.listen(iframeIO, goog.net.EventType.COMPLETE, function(e) {
                            var res = this.getResponseXml();
                            goog.dom.removeNode(uploadForm);

                            var resStr = new XMLSerializer().serializeToString(res.documentElement);
                            G.doc.loadFromString(resStr);
                        });
                        */
                    }
                });
            });

        // Create a button inside menubar.
        var btn = new goog.ui.MenuButton(menuNames[i], menu);
        btn.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
        menubar.addChild(btn, true);
    }
    menubar.render(goog.dom.getElement('oar-menubar'));

    return menubar;
};

//---------------------------------------------------------------------------------------------------------------------- toolbar
var Toolbar = function() {
    var toolbar = new goog.ui.Toolbar();
    asse(toolbar, Toolbar);

    toolbar.render(goog.dom.getElement('oar-toolbar'));
    var tbSep0 = new goog.ui.ToolbarSeparator();
    toolbar.addChild(tbSep0, true);
    tbSep0.getElement().style.height = '100%';

    // font family
    var fontMenu = new goog.ui.Menu();
    goog.array.forEach(['宋体','楷体','黑体', null, 'Arial', 'Courier New','Times New Roman'], function(font) {
        if( font ) {
            var item = new goog.ui.Option(font);
            fontMenu.addChild(item, true);
            item.getElement().getElementsByClassName('goog-menuitem-content')[0].style.fontFamily = font;
        } else {
            fontMenu.addChild(new goog.ui.MenuSeparator(), true);
        }
    });
    var fontSelector = new goog.ui.ToolbarSelect('宋体', fontMenu);
    toolbar.fontSelector = fontSelector;
    toolbar.addChild(fontSelector, true);
    fontSelector.getElement().getElementsByClassName('goog-toolbar-menu-button-caption')[0].style.width = '70px';
    goog.events.listen(fontSelector, 'change', toolbar.fontChange);

    var tbSep1 = new goog.ui.ToolbarSeparator();
    toolbar.addChild(tbSep1, true);
    tbSep1.getElement().style.marginLeft = '0px';

    // font size
    var sizeMenu = new goog.ui.Menu();
    goog.array.forEach([8, 9, 10, 11, 12, 14, 18, 24, 36, 48, 58, 70], function(size) {
        var item = new goog.ui.Option(size + '');
        sizeMenu.addChild(item, true);
        item.getElement().style.paddingRight = '3.5em';
        item.getElement().getElementsByClassName('goog-menuitem-content')[0].style.fontSize = size + 'px';
    });
    var sizeSelector = new goog.ui.ToolbarSelect('14', sizeMenu);
    toolbar.sizeSelector = sizeSelector;
    toolbar.addChild(sizeSelector, true);
    sizeSelector.getElement().getElementsByClassName('goog-toolbar-menu-button-caption')[0].style.width = '10px';
    sizeMenu.getElement().style.height = '300px';
    sizeMenu.getElement().style.overflowY = 'scroll';
    goog.events.listen(sizeSelector, 'change', toolbar.sizeChange);

    var tbSep2 = new goog.ui.ToolbarSeparator();
    toolbar.addChild(tbSep2, true);
    tbSep2.getElement().style.marginLeft = '0px';

    // font color
    var fontColorSelector = new goog.ui.ColorMenuButton('A', goog.ui.ColorMenuButton.newColorMenu(),
        goog.ui.ToolbarColorMenuButtonRenderer.getInstance());

    toolbar.addChild(fontColorSelector, true);
    toolbar.fontColorSelector = fontColorSelector;
    fontColorSelector.setSelectedColor('#000000');
    var fontColorCap = fontColorSelector.getElement().getElementsByClassName('goog-toolbar-menu-button-caption')[0];
    var fontColorDrop = fontColorSelector.getElement().getElementsByClassName('goog-toolbar-menu-button-dropdown')[0];
    fontColorCap.style.padding = '0px';
    fontColorCap.style.marginLeft = '3px';
    fontColorCap.style.width = '16px';
    fontColorCap.style.textAlign = 'center';
    fontColorDrop.style.marginRight = '1px';

    goog.events.listen(fontColorSelector, goog.ui.Component.EventType.ACTION, toolbar.colorChange);

    // background color

    var bgColorMenu = goog.ui.ColorMenuButton.newColorMenu();
    var noneBgColorItem = new goog.ui.MenuItem('无填充颜色', goog.ui.ColorMenuButton.NO_COLOR);
    bgColorMenu.addChildAt(noneBgColorItem, 0, true);
    bgColorMenu.addChildAt(new goog.ui.Separator(), 1, true);

    noneBgColorItem.getElement().style.paddingRight = '0px';

    var bgColorSelector = new goog.ui.ColorMenuButton('A', bgColorMenu,
        goog.ui.ToolbarColorMenuButtonRenderer.getInstance());

    toolbar.addChild(bgColorSelector, true);
    toolbar.bgColorSelector = bgColorSelector;
    var bgColorCap = bgColorSelector.getElement().getElementsByClassName('goog-toolbar-menu-button-caption')[0];
    var bgColorDrop = bgColorSelector.getElement().getElementsByClassName('goog-toolbar-menu-button-dropdown')[0];
    bgColorCap.style.padding = '0px';
    bgColorCap.style.marginLeft = '3px';
    bgColorCap.style.width = '16px';
    bgColorCap.style.textAlign = 'center';
    bgColorCap.style.color = '#FFF';
    bgColorCap.style.backgroundColor = '#000';
    bgColorDrop.style.marginRight = '1px';

    goog.events.listen(bgColorSelector, goog.ui.Component.EventType.ACTION, toolbar.bgColorChange);

    // bold toggle
    var boldSet = new goog.ui.ToolbarToggleButton('B');
    toolbar.boldSet = boldSet;
    toolbar.addChild(boldSet, true);
    boldSet.getElement().style.fontFamily = 'Times New Roman';
    goog.events.listen(boldSet,
        goog.ui.Component.EventType.ACTION,
        toolbar.WSDSChange
    );

    // italic
    var italicSet = new goog.ui.ToolbarToggleButton('I');
    toolbar.italicSet = italicSet;
    toolbar.addChild(italicSet, true);
    italicSet.getElement().style.fontFamily = 'Times New Roman';
    italicSet.getElement().style.fontStyle = 'italic';
    goog.events.listen(italicSet,
        goog.ui.Component.EventType.ACTION,
        toolbar.WSDSChange
    );

    // underline
    var underlineSet = new goog.ui.ToolbarToggleButton('U');
    toolbar.underlineSet = underlineSet;
    toolbar.addChild(underlineSet, true);
    underlineSet.getElement().style.fontFamily = 'Times New Roman';
    underlineSet.getElement().getElementsByClassName('goog-toolbar-button-inner-box')[0].style.textDecoration = 'underline';
    goog.events.listen(underlineSet,
        goog.ui.Component.EventType.ACTION,
        toolbar.WSDSChange
    );

    // superscript
    var spsIcon = goog.dom.createDom('div');
    spsIcon.style.background = 'url(img/sprite.png) no-repeat -3px -1703px';
    spsIcon.style.width = '14px';
    spsIcon.style.height = '16px';
    var superScriptSet = new goog.ui.ToolbarToggleButton(spsIcon);
    toolbar.superScriptSet = superScriptSet;
    toolbar.addChild(superScriptSet, true);
    goog.events.listen(superScriptSet,
        goog.ui.Component.EventType.ACTION,
        function(e) {
            if( this.isChecked() ) {
                subScriptSet.setChecked(false);
            }
            toolbar.WSDSChange(e);
        }
    );

    // subscript
    var sbsIcon = goog.dom.createDom('div');
    sbsIcon.style.background = 'url(img/sprite.png) no-repeat -24px -1914px';
    sbsIcon.style.width = '14px';
    sbsIcon.style.height = '16px';
    var subScriptSet = new goog.ui.ToolbarToggleButton(sbsIcon);
    toolbar.subScriptSet = subScriptSet;
    toolbar.addChild(subScriptSet, true);
    goog.events.listen(subScriptSet,
        goog.ui.Component.EventType.ACTION,
        function(e) {
            if( this.isChecked() ) {
                superScriptSet.setChecked(false);
            }
            toolbar.WSDSChange(e);
        }
    );

    var tbSepFont = new goog.ui.ToolbarSeparator();
    toolbar.addChild(tbSepFont, true);
    tbSepFont.getElement().style.marginLeft = '0px';

    // paragraph align left
    var alignLeftIcon = goog.dom.createDom('div');
    alignLeftIcon.style.background = 'url(img/sprite.png) no-repeat -3px -2018px';
    alignLeftIcon.style.width = '14px';
    alignLeftIcon.style.height = '16px';
    var alignLeftSet = new goog.ui.ToolbarToggleButton(alignLeftIcon);
    toolbar.alignLeftSet = alignLeftSet;
    toolbar.addChild(alignLeftSet, true);
    goog.events.listen(alignLeftSet,
        goog.ui.Component.EventType.ACTION,
        function(e) {
            if( this.isChecked() ) {
                //alignLeftSet.setChecked(false);
                alignCenterSet.setChecked(false);
                alignRightSet.setChecked(false);

                toolbar.paraAlignChange(e);
                G.cursor.refreshTarget();
            }
            G.inputbox.focus();
        }
    );

    // paragraph align center
    var alignCenterIcon = goog.dom.createDom('div');
    alignCenterIcon.style.background = 'url(img/sprite.png) no-repeat -3px -1787px';
    alignCenterIcon.style.width = '14px';
    alignCenterIcon.style.height = '16px';
    var alignCenterSet = new goog.ui.ToolbarToggleButton(alignCenterIcon);
    toolbar.alignCenterSet = alignCenterSet;
    toolbar.addChild(alignCenterSet, true);
    goog.events.listen(alignCenterSet,
        goog.ui.Component.EventType.ACTION,
        function(e) {
            if( this.isChecked() ) {
                alignLeftSet.setChecked(false);
                //alignCenterSet.setChecked(false);
                alignRightSet.setChecked(false);

                toolbar.paraAlignChange(e);
                G.cursor.refreshTarget();
            }
            G.inputbox.focus();
        }
    );

    // paragraph align right
    var alignRightIcon = goog.dom.createDom('div');
    alignRightIcon.style.background = 'url(img/sprite.png) no-repeat -24px -548px';
    alignRightIcon.style.width = '14px';
    alignRightIcon.style.height = '16px';
    var alignRightSet = new goog.ui.ToolbarToggleButton(alignRightIcon);
    toolbar.alignRightSet = alignRightSet;
    toolbar.addChild(alignRightSet, true);
    goog.events.listen(alignRightSet,
        goog.ui.Component.EventType.ACTION,
        function(e) {
            if( this.isChecked() ) {
                alignLeftSet.setChecked(false);
                alignCenterSet.setChecked(false);
                //alignRightSet.setChecked(false);

                toolbar.paraAlignChange(e);
                G.cursor.refreshTarget();
            }
            G.inputbox.focus();
        }
    );

    var tbSepAlign = new goog.ui.ToolbarSeparator();
    toolbar.addChild(tbSepAlign, true);
    tbSepAlign.getElement().style.marginLeft = '0px';

    // insert picture button
    var insertImgIcon = goog.dom.createDom('div');
    insertImgIcon.style.background = 'url(img/components-toolbar-icons.png) no-repeat -480px 0';
    insertImgIcon.style.width = '16px';
    insertImgIcon.style.height = '16px';

    var insertImgBtn = new goog.ui.ToolbarButton(insertImgIcon);
    toolbar.addChild(insertImgBtn, true);
    var insertImgDialog = new InsertImgDialog();

    goog.events.listen(insertImgBtn.getElement(),
        goog.events.EventType.CLICK,
        function(e) {
            insertImgDialog.setVisible(true);
        }
    );

    // insert table button
    var tableDimensionMenu = new goog.ui.Menu();
    var dimensionPicker = new goog.ui.DimensionPicker();
    tableDimensionMenu.addChild(dimensionPicker, true);
    goog.events.listen(dimensionPicker, goog.ui.Component.EventType.ACTION,
        function(e) {
            var picker = e.target;
            var size = picker.getValue();

            G.cursor.addTable(size);
        });

    var insertTableIcon = goog.dom.createDom('div');
    insertTableIcon.style.background = 'url(img/components-toolbar-icons.png) no-repeat -336px -16px';
    insertTableIcon.style.width = '16px';
    insertTableIcon.style.height = '16px';

    var insertTableBtn = new goog.ui.ToolbarMenuButton(insertTableIcon, tableDimensionMenu);
    toolbar.addChild(insertTableBtn, true);
    insertTableBtn.getElement().getElementsByClassName('goog-toolbar-menu-button-caption')[0].style.paddingRight = '0px';
    insertTableBtn.getElement().getElementsByClassName('goog-toolbar-menu-button-dropdown')[0].style.marginRight = '1px';

    var tbSepInsert = new goog.ui.ToolbarSeparator();
    toolbar.addChild(tbSepInsert, true);
    tbSepInsert.getElement().style.marginLeft = '0px';

    // test toggle button
    /*
    var toggleBtn = new goog.ui.ToolbarToggleButton('?Togg');
    toolbar.addChild(toggleBtn, true);

    var tbSep3 = new goog.ui.ToolbarSeparator();
    toolbar.addChild(tbSep3, true);
    tbSep3.getElement().style.marginLeft = '0px';

    goog.events.listen(toggleBtn,
        goog.ui.Component.EventType.ACTION,
        function(e) {
            console.log('toggle button:' + this.isChecked());
        }
    );

    // test button
    var testBtn = new goog.ui.ToolbarButton('?Test');
    toolbar.addChild(testBtn, true);

    var tbSep4 = new goog.ui.ToolbarSeparator();
    toolbar.addChild(tbSep4, true);
    tbSep4.getElement().style.marginLeft = '0px';

    goog.events.listen(testBtn.getElement(),
        goog.events.EventType.CLICK,
        function(e) {
            console.log('tset button');
        }
    );
    */
    return toolbar;
};

Toolbar.fontChange = function(e) {
    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    G.inputbox.focus();
    var bFo = false;
    var line = G.rangeSelector.foLine;
    var oldLine = line;
    while( line != null && line.hasOverlay() ) {
        for( var i = 0; i < line.childrenEle.length; ++i ) {
            var block = line.childrenEle[i];

            if( block.className && block.className == 'oar-inline-block' ) {
                var blockStyle = block.getBlockStyle();
                var blockLeft = null;
                var blockRight = null;
                var bCut = false;

                if( block.overlay.si > 0 ) {
                    blockLeft = new InlineBlock();
                    blockLeft.textContent = block.textContent.substring(0, block.overlay.si);
                    blockLeft.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( block.overlay.ei < block.textContent.length - 1 ) {
                    blockRight = new InlineBlock();
                    blockRight.textContent = block.textContent.substring(block.overlay.ei + 1);
                    blockRight.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( bCut ) {
                    block.textContent = block.textContent.substring(block.overlay.si, block.overlay.ei + 1);
                    if( blockLeft ) {
                        line.insertBlockBefore(blockLeft, block);
                        block.overlay.si = 0;
                        ++i;
                    }
                    if( blockRight ) {
                        line.insertBlockAfter(blockRight, block);
                        block.overlay.ei =  block.textContent.length - 1;
                        ++i;
                    }
                }
                if( block.overlay.si >= 0 ) {
                    blockStyle.fontFamily = G.toolbar.fontSelector.getValue();
                    G.doc.changeStyle(block, blockStyle, null, null, true);
                }
            }
        }

        if( line.hasOverlay() ) {
            line.refreshOverlayLayer();
            if( bFo ) {
                G.rangeSelector.foLine = line;
                bFo = false;
            }
        } else {
            line.ClearOverlayLayer();
            bFo = true;
        }

        line = line.getNextLineThroughPageTdAvoidTable();
    }

    if( oldLine ) {
        oldLine.handleOverflow();
        oldLine.handleWidthLack();
        oldLine.handleLineAlign();
    }

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
}

Toolbar.sizeChange = function(e) {
    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    G.inputbox.focus();
    var bFo = false;
    var line = G.rangeSelector.foLine;
    var oldLine = line;
    while( line != null && line.hasOverlay() ) {
        for( var i = 0; i < line.childrenEle.length; ++i ) {
            var block = line.childrenEle[i];

            if( block.className && block.className == 'oar-inline-block' ) {
                var blockStyle = block.getBlockStyle();
                var blockLeft = null;
                var blockRight = null;
                var bCut = false;

                if( block.overlay.si > 0 ) {
                    blockLeft = new InlineBlock();
                    blockLeft.textContent = block.textContent.substring(0, block.overlay.si);
                    blockLeft.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( block.overlay.ei < block.textContent.length - 1 ) {
                    blockRight = new InlineBlock();
                    blockRight.textContent = block.textContent.substring(block.overlay.ei + 1);
                    blockRight.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( bCut ) {
                    block.textContent = block.textContent.substring(block.overlay.si, block.overlay.ei + 1);
                    if( blockLeft ) {
                        line.insertBlockBefore(blockLeft, block);
                        block.overlay.si = 0;
                        ++i;
                    }
                    if( blockRight ) {
                        line.insertBlockAfter(blockRight, block);
                        block.overlay.ei =  block.textContent.length - 1;
                        ++i;
                    }
                }

                if( block.overlay.si >= 0 ) {
                    blockStyle.fontSize = G.toolbar.sizeSelector.getValue() + 'px';
                    G.doc.changeStyle(block, blockStyle, null, null, true);
                }
            }
        }

        if( line.hasOverlay() ) {
            line.refreshOverlayLayer();
            if( bFo ) {
                G.rangeSelector.foLine = line;
                bFo = false;
            }
        } else {
            line.ClearOverlayLayer();
            bFo = true;
        }

        line = line.getNextLineThroughPageTdAvoidTable();
    }

    if( oldLine ) {
        oldLine.handleOverflow();
        oldLine.handleWidthLack();
    }

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
}

Toolbar.colorChange = function(e) {
    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    G.inputbox.focus();
    var bFo = false;
    var line = G.rangeSelector.foLine;
    var oldLine = line;
    while( line != null && line.hasOverlay() ) {
        for( var i = 0; i < line.childrenEle.length; ++i ) {
            var block = line.childrenEle[i];

            if( block.className && block.className == 'oar-inline-block' ) {
                var blockStyle = block.getBlockStyle();
                var blockLeft = null;
                var blockRight = null;
                var bCut = false;

                if( block.overlay.si > 0 ) {
                    blockLeft = new InlineBlock();
                    blockLeft.textContent = block.textContent.substring(0, block.overlay.si);
                    blockLeft.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( block.overlay.ei < block.textContent.length - 1 ) {
                    blockRight = new InlineBlock();
                    blockRight.textContent = block.textContent.substring(block.overlay.ei + 1);
                    blockRight.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( bCut ) {
                    block.textContent = block.textContent.substring(block.overlay.si, block.overlay.ei + 1);
                    if( blockLeft ) {
                        line.insertBlockBefore(blockLeft, block);
                        block.overlay.si = 0;
                        ++i;
                    }
                    if( blockRight ) {
                        line.insertBlockAfter(blockRight, block);
                        block.overlay.ei =  block.textContent.length - 1;
                        ++i;
                    }
                }

                if( block.overlay.si >= 0 ) {
                    blockStyle.color = G.toolbar.fontColorSelector.getSelectedColor();
                    G.doc.changeStyle(block, blockStyle, null, null, true);
                }
            }
        }

        if( line.hasOverlay() ) {
            line.refreshOverlayLayer();
            if( bFo ) {
                G.rangeSelector.foLine = line;
                bFo = false;
            }
        } else {
            line.ClearOverlayLayer();
            bFo = true;
        }

        line = line.getNextLineThroughPageTdAvoidTable();
    }

    if( oldLine ) {
        oldLine.handleOverflow();
        oldLine.handleWidthLack();
    }

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
}

Toolbar.bgColorChange = function(e) {
    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    G.inputbox.focus();
    var bFo = false;
    var line = G.rangeSelector.foLine;
    var oldLine = line;
    while( line != null && line.hasOverlay() ) {
        for( var i = 0; i < line.childrenEle.length; ++i ) {
            var block = line.childrenEle[i];

            if( block.className && block.className == 'oar-inline-block' ) {
                var blockStyle = block.getBlockStyle();
                var blockLeft = null;
                var blockRight = null;
                var bCut = false;

                if( block.overlay.si > 0 ) {
                    blockLeft = new InlineBlock();
                    blockLeft.textContent = block.textContent.substring(0, block.overlay.si);
                    blockLeft.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( block.overlay.ei < block.textContent.length - 1 ) {
                    blockRight = new InlineBlock();
                    blockRight.textContent = block.textContent.substring(block.overlay.ei + 1);
                    blockRight.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( bCut ) {
                    block.textContent = block.textContent.substring(block.overlay.si, block.overlay.ei + 1);
                    if( blockLeft ) {
                        line.insertBlockBefore(blockLeft, block);
                        block.overlay.si = 0;
                        ++i;
                    }
                    if( blockRight ) {
                        line.insertBlockAfter(blockRight, block);
                        block.overlay.ei =  block.textContent.length - 1;
                        ++i;
                    }
                }

                if( block.overlay.si >= 0  ) {
                    blockStyle.backgroundColor = G.toolbar.bgColorSelector.getSelectedColor();
                    G.doc.changeStyle(block, blockStyle, null, null, true);
                }

            }
        }

        if( line.hasOverlay() ) {
            line.refreshOverlayLayer();
            if( bFo ) {
                G.rangeSelector.foLine = line;
                bFo = false;
            }
        } else {
            line.ClearOverlayLayer();
            bFo = true;
        }

        line = line.getNextLineThroughPageTdAvoidTable();
    }

    if( oldLine ) {
        oldLine.handleOverflow();
        oldLine.handleWidthLack();
    }

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
}

Toolbar.WSDSChange = function(e) {
    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    G.inputbox.focus();
    var bFo = false;
    var line = G.rangeSelector.foLine;
    var oldLine = line;
    while( line != null && line.hasOverlay() ) {
        for( var i = 0; i < line.childrenEle.length; ++i ) {
            var block = line.childrenEle[i];

            if( block.className && block.className == 'oar-inline-block' ) {
                var blockStyle = block.getBlockStyle();
                var blockLeft = null;
                var blockRight = null;
                var bCut = false;

                if( block.overlay.si > 0 ) {
                    blockLeft = new InlineBlock();
                    blockLeft.textContent = block.textContent.substring(0, block.overlay.si);
                    blockLeft.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( block.overlay.ei < block.textContent.length - 1 ) {
                    blockRight = new InlineBlock();
                    blockRight.textContent = block.textContent.substring(block.overlay.ei + 1);
                    blockRight.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( bCut ) {
                    block.textContent = block.textContent.substring(block.overlay.si, block.overlay.ei + 1);
                    if( blockLeft ) {
                        line.insertBlockBefore(blockLeft, block);
                        block.overlay.si = 0;
                        ++i;
                    }
                    if( blockRight ) {
                        line.insertBlockAfter(blockRight, block);
                        block.overlay.ei =  block.textContent.length - 1;
                        ++i;
                    }
                }

                if( block.overlay.si >= 0 ) {
                    blockStyle.fontWeight = G.toolbar.getBold();
                    blockStyle.fontStyle = G.toolbar.getItalic();
                    blockStyle.textDecoration = G.toolbar.getUnderline();
                    blockStyle.script = G.toolbar.getScript();
                    G.doc.changeStyle(block, blockStyle, null, null, true);
                }
            }
        }

        if( line.hasOverlay() ) {
            line.refreshOverlayLayer();
            if( bFo ) {
                G.rangeSelector.foLine = line;
                bFo = false;
            }
        } else {
            line.ClearOverlayLayer();
            bFo = true;
        }

        line = line.getNextLineThroughPageTdAvoidTable();
    }

    if( oldLine ) {
        oldLine.handleOverflow();
        oldLine.handleWidthLack();
    }

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
}

Toolbar.paraAlignChange = function(e) {
    var lineFC = goog.dom.getParentElement(G.cursor.target.inline);
    var lineF = goog.dom.getParentElement(lineFC);
    var paraF = goog.dom.getParentElement(lineF);
    var pStyleF = new ParagraphStyle();
    pStyleF.align = G.toolbar.getParagraphAlign();
    G.doc.changeStyle(null, null, lineF, pStyleF, true);

    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    G.inputbox.focus();
    var bFo = false;
    var line = G.rangeSelector.foLine;
    var oldLine = line;
    while( line != null && line.hasOverlay() ) {
        var para = goog.dom.getParentElement(line);

        if( para != paraF ) {
            var paraStyle = new ParagraphStyle();
            paraStyle.align = G.toolbar.getParagraphAlign();
            G.doc.changeStyle(null, null, line, paraStyle, true);
            para.handleLineAlign();

            if( line.hasOverlay() ) {
                line.refreshOverlayLayer();
                if( bFo ) {
                    G.rangeSelector.foLine = line;
                    bFo = false;
                }
            } else {
                line.ClearOverlayLayer();
                bFo = true;
            }

            paraF = para;
        }


        line = line.getNextLineThroughPageTdAvoidTable();
    }

    if( oldLine ) {
        oldLine.handleOverflow();
        oldLine.handleWidthLack();
    }

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
}

Toolbar.setStyle = function(blockStyle, paraStyle) {
    var fontFamily =  blockStyle.fontFamily != "" ?  blockStyle.fontFamily.replace(/'/g, '') : '宋体';
    var fontSize =  blockStyle.fontSize != "" ?  blockStyle.fontSize.replace(/px/g, '') : '14';
    var fontColor = blockStyle.color != "" ?  blockStyle.color : '#000000';
    var bgColor = blockStyle.backgroundColor != ""  ? blockStyle.backgroundColor : 'transparent';
    var fontWeight = blockStyle.fontWeight;
    var fontStyle = blockStyle.fontStyle;
    var textDeco = blockStyle.textDecoration;
    var script = blockStyle.script;
    var paraAlign = paraStyle.align;

    this.fontSelector.setValue(fontFamily);
    this.sizeSelector.setValue(fontSize);
    this.fontColorSelector.setSelectedColor(fontColor);
    this.bgColorSelector.setSelectedColor(bgColor);

    if( fontWeight == 'normal' ) {
        this.boldSet.setChecked(false);
    } else if( fontWeight == 'bold' ) {
        this.boldSet.setChecked(true);
    }

    if( fontStyle == 'normal' ) {
        this.italicSet.setChecked(false);
    } else if( fontWeight == 'italic' ) {
        this.italicSet.setChecked(true);
    }

    if( textDeco == 'none' ) {
        this.underlineSet.setChecked(false);
    } else if( textDeco == 'underline' ) {
        this.underlineSet.setChecked(true);
    }

    if( script == 'normal' ) {
        this.superScriptSet.setChecked(false);
        this.subScriptSet.setChecked(false);
    } else if( script == 'superscript' ) {
        this.superScriptSet.setChecked(true);
        this.subScriptSet.setChecked(false);
    } else if( script == 'subscript' ) {
        this.superScriptSet.setChecked(false);
        this.subScriptSet.setChecked(true);
    }

    if( paraAlign == 'left' ) {
        this.alignLeftSet.setChecked(true);
        this.alignCenterSet.setChecked(false);
        this.alignRightSet.setChecked(false);
    } else if( paraAlign == 'center' ) {
        this.alignLeftSet.setChecked(false);
        this.alignCenterSet.setChecked(true);
        this.alignRightSet.setChecked(false);
    } else if( paraAlign == 'right' ) {
        this.alignLeftSet.setChecked(false);
        this.alignCenterSet.setChecked(false);
        this.alignRightSet.setChecked(true);
    }
}

Toolbar.getFontFamily = function() {
    var ff = this.fontSelector.getValue();
    if( !ff ) {
        ff = '宋体';
    }

    return ff;
}

Toolbar.getFontSize = function() {
    var ff = this.sizeSelector.getValue();
    if( !ff ) {
        ff = '14';
    }

    return ff;
}

Toolbar.getFontColor = function() {
    var fc = this.fontColorSelector.getSelectedColor();
    if( !fc ) {
        fc = '#000000';
    }

    return fc;
}

Toolbar.getBgColor = function() {
    var bc = this.bgColorSelector.getSelectedColor();
    if( bc == null ) {
        bc = 'transparent';
    }
    return bc;
}

Toolbar.getBold = function() {
    if( this.boldSet.isChecked() ) {
        return 'bold';
    } else {
        return 'normal';
    }
}

Toolbar.getItalic = function() {
    if( this.italicSet.isChecked() ) {
        return 'italic';
    } else {
        return 'normal';
    }
}

Toolbar.getUnderline = function() {
    if( this.underlineSet.isChecked() ) {
        return 'underline';
    } else {
        return 'none';
    }
}

Toolbar.getScript = function() {
    if( this.superScriptSet.isChecked() ) {
        return 'superscript';
    } else if ( this.subScriptSet.isChecked() ) {
        return 'subscript';
    } else {
        return 'normal';
    }
}

Toolbar.getParagraphAlign = function() {
    if( this.alignLeftSet.isChecked() ) {
        return 'left';
    } else if ( this.alignCenterSet.isChecked() ) {
        return 'center';
    } else if ( this.alignRightSet.isChecked() ) {
        return 'right';
    } else {
        return 'left';
    }
}

Toolbar.getBlockStyle = function() {
    var ff = this.getFontFamily();
    var fs = this.getFontSize() + 'px';
    var fc = this.getFontColor();

    var style = new BlockStyle(ff, fs, fc);
    style.backgroundColor = this.getBgColor();
    style.textDecoration = this.getUnderline();
    style.fontWeight = this.getBold();
    style.fontStyle = this.getItalic();
    //style.letterSpacing = '5px';
    style.setScript(this.getScript());

    return style;
}

//---------------------------------------------------------------------------------------------------------------------- dialog

var InfoDialog = function() {
    var dialog = new goog.ui.Dialog();
    asse(dialog, NewFileDialog);
    dialog.setBackgroundElementOpacity(0.2);
    var dialogContent = dialog.getContentElement();
    dialogContent.style.minWidth = '400px';

    var infoDiv = goog.dom.createDom('div');
    infoDiv.style.webkitUserSelect = 'none';
    infoDiv.style.fontSize = '11px';
    infoDiv.style.margin = '15px 4px 10px 4px';
    dialog.info = infoDiv;

    dialogContent.appendChild(infoDiv);
    dialog.setTitle('提示');

    var dialogButtonSet = dialog.getButtonSet();
    var okBtn = dialogButtonSet.getButton('ok');
    var cancelBtn = dialogButtonSet.getButton('cancel');
    okBtn.textContent = '确定';
    cancelBtn.textContent = '取消';

    return dialog;
}

var PrintViewDialog = function() {
    var dialog = new goog.ui.Dialog();
    asse(dialog, PrintViewDialog);
    dialog.setBackgroundElementOpacity(0.2);
    var dialogContent = dialog.getContentElement();
    dialogContent.style.minWidth = '415px';
    dialogContent.style.paddingBottom = '0px';

    var fileNameInput = goog.dom.createDom('input');
    fileNameInput.type = 'hidden';
    fileNameInput.name = 'name';
    dialog.fileNameInput = fileNameInput;
    var fileXmlInput = goog.dom.createDom('input');
    fileXmlInput.type = 'hidden';
    fileXmlInput.name = 'xml';
    dialog.fileXmlInput = fileXmlInput;

    var printViewDiv = goog.dom.createDom('div');
    printViewDiv.style.webkitUserSelect = 'none';
    printViewDiv.style.display = 'none';
    printViewDiv.style.fontSize = '11px';
    printViewDiv.style.fontFamily = 'Times New Roman';
    printViewDiv.style.margin = '15px 4px 10px 4px';
    printViewDiv.appendChild(fileNameInput);
    printViewDiv.appendChild(fileXmlInput);

    var printViewForm = goog.dom.createDom('form');
    printViewForm.action = 'upload';
    printViewForm.method = 'POST';
    printViewForm.enctype = 'multipart/form-data';
    dialog.printViewForm = printViewForm;
    printViewForm.appendChild(printViewDiv);

    // error line
    var dialogErrLine = goog.dom.createDom('div');
    dialogErrLine.style.display = 'inline';
    dialogErrLine.style.lineHeight = '40px';
    dialogErrLine.style.color = '#fff';
    dialogErrLine.style.backgroundColor = '#EB8257';
    dialogErrLine.style.fontSize = '11px';
    dialogErrLine.style.marginLeft = '11px';
    dialogErrLine.style.marginTop = '10px';
    dialogErrLine.style.padding = '5px';
    dialogErrLine.style.webkitUserSelect = 'none';
    dialog.error = dialogErrLine;

    dialogErrLine.textContent = '请稍等...';

    dialogContent.appendChild(dialogErrLine);
    dialogContent.appendChild(printViewForm);

    dialog.setTitle('打印预览');

    var dialogButtonSet = dialog.getButtonSet();
    var okBtn = dialogButtonSet.getButton('ok');
    var cancelBtn = dialogButtonSet.getButton('cancel');
    okBtn.textContent = '确定';
    cancelBtn.textContent = '取消';

    return dialog;
}

PrintViewDialog.run = function() {
    var title = goog.dom.getElement('oar-titlebar');
    var fileName = title.textContent;

    this.fileNameInput.value = fileName;

    var xmlString = G.doc.traverseToString();
    this.fileXmlInput.value = xmlString;

    var iframeIO = new goog.net.IframeIo();
    iframeIO.sendFromForm(this.printViewForm, config.appbase + '/PrintView');
    this.doing = true;

    var that = this;
    goog.events.listen(iframeIO, goog.net.EventType.COMPLETE, function(e) {
        that.setVisible(false);
        this.doing = false;

        var resText = this.getResponseText();
        if( resText != null && resText != '' && resText != 'error' ) {
            var win = window.open(config.appbase + '/' + resText, '_blank');
            win.focus();
        } else {
            var errDlg = new InfoDialog();
            errDlg.info.style.color = '#f00';
            errDlg.info.textContent = '很抱歉，发生故障了！';
            errDlg.setVisible(true);
        }
    });

    return false;
}

var DownloadDialog = function() {
    var dialog = new goog.ui.Dialog();
    asse(dialog, DownloadDialog);
    dialog.setBackgroundElementOpacity(0.2);
    var dialogContent = dialog.getContentElement();
    dialogContent.style.minWidth = '415px';

    var fileTypeDiv = goog.dom.createDom('div');
    fileTypeDiv.style.webkitUserSelect = 'none';
    fileTypeDiv.style.fontSize = '11px';
    fileTypeDiv.style.fontFamily = 'Times New Roman';
    fileTypeDiv.style.margin = '15px 4px 10px 4px';

    var fileTypeSpan = goog.dom.createDom('span');
    fileTypeSpan.textContent = '选择格式: ';
    fileTypeSpan.style.webkitUserSelect = 'none';

    var radioDoc = goog.dom.createDom('input');
    radioDoc.type = 'radio';
    radioDoc.name = 'type';
    radioDoc.value = 'doc';
    radioDoc.id = 'file-type-doc';
    radioDoc.style.verticalAlign = 'bottom';
    radioDoc.style.marginTop = '-1px';
    var radioDocSpan = goog.dom.createDom('span');
    radioDocSpan.textContent = 'Word 97-03 (.doc)';
    radioDocSpan.style.marginRight = '10px';
    radioDocSpan.style.marginBottom = '3px';

    var radioDocx = goog.dom.createDom('input');
    radioDocx.type = 'radio';
    radioDocx.name = 'type';
    radioDocx.value = 'docx';
    radioDocx.id = 'file-type-docx';
    radioDocx.checked = 'checked';
    radioDocx.style.verticalAlign = 'bottom';
    radioDocx.style.marginTop = '-1px';
    var radioDocxSpan = goog.dom.createDom('span');
    radioDocxSpan.textContent = 'Word 07-10 (.docx)';
    radioDocxSpan.style.marginRight = '10px';

    var radioPDF = goog.dom.createDom('input');
    radioPDF.type = 'radio';
    radioPDF.name = 'type';
    radioPDF.value = 'pdf';
    radioPDF.id = 'file-type-pdf';
    radioPDF.style.verticalAlign = 'bottom';
    radioPDF.style.marginTop = '-1px';
    var radioPDFSpan = goog.dom.createDom('span');
    radioPDFSpan.textContent = 'PDF (.pdf)';
    radioPDFSpan.style.marginRight = '10px';

    var fileNameInput = goog.dom.createDom('input');
    fileNameInput.type = 'hidden';
    fileNameInput.name = 'name';
    dialog.fileNameInput = fileNameInput;
    var fileXmlInput = goog.dom.createDom('input');
    fileXmlInput.type = 'hidden';
    fileXmlInput.name = 'xml';
    dialog.fileXmlInput = fileXmlInput;

    fileTypeDiv.appendChild(fileTypeSpan);
    fileTypeDiv.appendChild(radioDoc);
    fileTypeDiv.appendChild(radioDocSpan);
    fileTypeDiv.appendChild(radioDocx);
    fileTypeDiv.appendChild(radioDocxSpan);
    fileTypeDiv.appendChild(radioPDF);
    fileTypeDiv.appendChild(radioPDFSpan);
    fileTypeDiv.appendChild(fileNameInput);
    fileTypeDiv.appendChild(fileXmlInput);

    var fileDownloadForm = goog.dom.createDom('form');
    fileDownloadForm.action = 'upload';
    fileDownloadForm.method = 'POST';
    fileDownloadForm.enctype = 'multipart/form-data';
    dialog.fileDownloadForm = fileDownloadForm;
    fileDownloadForm.appendChild(fileTypeDiv);

    // error line
    var dialogErrLine = goog.dom.createDom('div');
    dialogErrLine.style.display = 'none';
    dialogErrLine.style.color = '#fff';
    dialogErrLine.style.backgroundColor = '#EB8257';
    dialogErrLine.style.fontSize = '11px';
    dialogErrLine.style.marginLeft = '11px';
    dialogErrLine.style.padding = '5px';
    dialogErrLine.style.webkitUserSelect = 'none';
    dialog.error = dialogErrLine;

    dialogContent.appendChild(fileDownloadForm);
    dialogContent.appendChild(dialogErrLine);
    dialog.setTitle('下载');

    var dialogButtonSet = dialog.getButtonSet();
    var okBtn = dialogButtonSet.getButton('ok');
    var cancelBtn = dialogButtonSet.getButton('cancel');
    okBtn.textContent = '下载';
    cancelBtn.textContent = '取消';

    goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, dialog.onInsert);

    return dialog;
}

DownloadDialog.onInsert = function(e) {
    if(e.key == 'ok' ) {
        var title = goog.dom.getElement('oar-titlebar');
        var fileName = title.textContent;

        this.fileNameInput.value = fileName;

        var xmlString = G.doc.traverseToString();
        this.fileXmlInput.value = xmlString;

        var iframeIO = new goog.net.IframeIo();
        iframeIO.sendFromForm(this.fileDownloadForm, config.appbase + '/Download');
        this.error.style.display = 'inline';
        this.error.textContent = '请稍等...';
        this.doing = true;

        var that = this;
        goog.events.listen(iframeIO, goog.net.EventType.COMPLETE, function(e) {
            that.setVisible(false);
            this.doing = false;

            var resText = this.getResponseText();
            if( resText != null && resText != '' && resText != 'error' ) {
                window.location = config.appbase + '/Download?file=' + resText;
            } else {
                var errDlg = new InfoDialog();
                errDlg.info.style.color = '#f00';
                errDlg.info.textContent = '很抱歉，发生故障了！';
                errDlg.setVisible(true);
            }
        });

        return false;
    }
};

var NewFileDialog = function() {
    var dialog = new goog.ui.Dialog();
    asse(dialog, NewFileDialog);
    dialog.setBackgroundElementOpacity(0.2);
    var dialogContent = dialog.getContentElement();
    dialogContent.style.minWidth = '400px';

    var fileNameDiv = goog.dom.createDom('div');
    fileNameDiv.style.webkitUserSelect = 'none';
    fileNameDiv.style.fontSize = '11px';
    fileNameDiv.style.margin = '15px 4px 10px 4px';

    var fileNameSpan = goog.dom.createDom('span');
    fileNameSpan.textContent = '文件名: ';
    fileNameSpan.style.webkitUserSelect = 'none';
    var fileNameInput = goog.dom.createDom('input');
    dialog.fileNameInput = fileNameInput;
    fileNameInput.type = 'text';
    fileNameInput.style.width = '325px';
    fileNameInput.style.border = '1px solid #ccc';
    fileNameInput.style.paddingLeft = '3px';
    fileNameDiv.appendChild(fileNameSpan);
    fileNameDiv.appendChild(fileNameInput);

    dialogContent.appendChild(fileNameDiv);
    dialog.setTitle('新建');

    var dialogButtonSet = dialog.getButtonSet();
    var okBtn = dialogButtonSet.getButton('ok');
    var cancelBtn = dialogButtonSet.getButton('cancel');
    okBtn.textContent = '新建';
    cancelBtn.textContent = '取消';

    goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, dialog.onInsert);

    return dialog;
}

NewFileDialog.onInsert = function(e) {
    if(e.key == 'ok' ) {
        var fileName = this.fileNameInput.value == '' ? '未命名' : this.fileNameInput.value;
        var titlebar = goog.dom.getElement('oar-titlebar');
        titlebar.textContent = fileName;

        // clear pages
        G.doc.renew();

        var xhr = new goog.net.XhrIo();
        xhr.send(config.appbase + '/NewFileName?file='+titlebar.textContent, 'GET');
    }
};

var OpenFileDialog = function () {
    var dialog = new goog.ui.Dialog();
    asse(dialog, OpenFileDialog);
    dialog.setBackgroundElementOpacity(0.2);
    var dialogContent = dialog.getContentElement();
    dialogContent.style.minWidth = '500px';

    // open file type radio
    var fileTypeSelect = goog.dom.createDom('div');
    fileTypeSelect.style.webkitUserSelect = 'none';
    fileTypeSelect.style.fontSize = '11px';
    fileTypeSelect.style.margin = '15px 4px 10px 4px';

    var radioComputer = goog.dom.createDom('input');
    radioComputer.type = 'radio';
    radioComputer.name = 'file-type';
    radioComputer.id = 'file-type-computer';
    radioComputer.checked = 'checked';
    var radioComputerSpan = goog.dom.createDom('span');
    radioComputerSpan.textContent = '从电脑上传';
    radioComputerSpan.style.marginRight = '10px';

    var radioWeipan = goog.dom.createDom('input');
    radioWeipan.type = 'radio';
    radioWeipan.name = 'file-type';
    radioWeipan.id = 'file-type-weipan';
    radioWeipan.style.display = 'none';
    var radioWeipanSpan = goog.dom.createDom('span');
    radioWeipanSpan.textContent = '从新浪微盘打开';

    fileTypeSelect.appendChild(radioComputer);
    fileTypeSelect.appendChild(radioComputerSpan);
    //fileTypeSelect.appendChild(radioWeipan);
    //fileTypeSelect.appendChild(radioWeipanSpan);

    // file type input
    var fileTypeInput = goog.dom.createDom('div');
    fileTypeInput.style.margin = '5px 5px 10px 7px';
    fileTypeInput.style.fontSize = '11px';
    fileTypeInput.style.minHeight = '25px';

    var fileTypeComputer = goog.dom.createDom('div');
    fileTypeComputer.style.display = 'inline';
    dialog.fileTypeComputer = fileTypeComputer;

    var computecrFileuploadForm = goog.dom.createDom('form');
    computecrFileuploadForm.action = 'upload';
    computecrFileuploadForm.method = 'POST';
    computecrFileuploadForm.enctype = 'multipart/form-data';
    dialog.fileTypeComputerForm = computecrFileuploadForm;

    var fileTypeComputerFile = goog.dom.createDom('input');
    fileTypeComputerFile.type = 'file';
    fileTypeComputerFile.name = 'file';
    dialog.fileTypeComputerFile = fileTypeComputerFile;
    computecrFileuploadForm.appendChild(fileTypeComputerFile);
    fileTypeComputer.appendChild(computecrFileuploadForm);
    radioComputer.dialog = dialog;

    var fileTypeWeipan = goog.dom.createDom('div');
    fileTypeWeipan.style.display = 'none';
    dialog.fileTypeWeipan = fileTypeWeipan;
    radioWeipan.dialog = dialog;

    /*
    var weipanIFrame = goog.dom.createDom('iframe');
    dialog.weipanIFrame = weipanIFrame;
    weipanIFrame.dialog = dialog;
    weipanIFrame.className = 'metadata-iframe'
    weipanIFrame.style.border = '0';
    weipanIFrame.style.width = '475px';
    weipanIFrame.style.height = '300px';
    weipanIFrame.src = 'http://weiboword.duapp.com/MetaData';
    weipanIFrame.style.display = 'none';
    goog.dom.appendChild(fileTypeWeipan, weipanIFrame);
    */

    // meta tree
    var weipanMetaData = goog.dom.createDom('div');
    weipanMetaData.dialog = dialog;
    weipanMetaData.className = 'metadata-tree';
    weipanMetaData.style.webkitUserSelect = 'none';
    weipanMetaData.style.width = '455px';
    weipanMetaData.style.height = '150px';
    weipanMetaData.style.overflow = 'auto';
    weipanMetaData.style.border = '1px solid #ccc';
    weipanMetaData.style.padding = '5px 10px 5px 10px';
    goog.dom.appendChild(fileTypeWeipan, weipanMetaData);

    var treeConfig = goog.ui.tree.TreeControl.defaultConfig;
    var tree = new goog.ui.tree.TreeControl('/', treeConfig);
    tree.render(weipanMetaData);
    dialog.weipanTree = tree;

    fileTypeInput.appendChild(fileTypeComputer);
    fileTypeInput.appendChild(fileTypeWeipan);

    // error line
    var dialogErrLine = goog.dom.createDom('div');
    dialogErrLine.style.display = 'none';
    dialogErrLine.style.color = '#fff';
    dialogErrLine.style.backgroundColor = '#EB8257';
    dialogErrLine.style.fontSize = '11px';
    dialogErrLine.style.marginLeft = '11px';
    dialogErrLine.style.padding = '5px';
    dialogErrLine.style.webkitUserSelect = 'none';
    dialog.error = dialogErrLine;

    // append all
    dialogContent.appendChild(fileTypeSelect);
    dialogContent.appendChild(fileTypeInput);
    dialogContent.appendChild(dialogErrLine);

    dialog.setTitle('打开文档');

    goog.events.listen(radioComputer, goog.events.EventType.CLICK, dialog.onFileTypeSelect);
    goog.events.listen(radioWeipan, goog.events.EventType.CLICK, dialog.onFileTypeSelect);
    //goog.events.listen(weipanIFrame, goog.events.EventType.LOAD, dialog.onIFrameLoad);
    goog.events.listen(weipanMetaData, goog.events.EventType.DBLCLICK, dialog.onMetaDBClick);

    dialog.type = 'computer';

    var dialogButtonSet = dialog.getButtonSet();
    var okBtn = dialogButtonSet.getButton('ok');
    var cancelBtn = dialogButtonSet.getButton('cancel');
    okBtn.textContent = '打开';
    cancelBtn.textContent = '取消';

    goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, dialog.onInsert);

    return dialog;
}

OpenFileDialog.onMetaDBClick = function(e) {
    var dialog = this.dialog;
    var node = dialog.weipanTree.getSelectedItem();

    if( node && node.is_dir && !node.hasChildren() ) {
        var path = "/";
        if( node.absPath ) {
            path = node.absPath;
        }
        dialog.weipanIFrame.src = 'MetaData?path=' + path;
    }
}

OpenFileDialog.setMetaData = function(node, content) {
    for(var i = 0; i < content.length; i++) {
        var child = content[i];
        var childNode = node.getTree().createNode(child.path.substring(child.path.lastIndexOf('/') + 1));
        childNode.absPath = child.path;
        if ( child.is_dir ) {
            childNode.is_dir = true;
        }

        node.add(childNode);

    }
}

OpenFileDialog.onIFrameLoad = function(e) {
    var dialog = this.dialog;
    var json = '{"size":"0 bytes","rev":"2b07d3b0","thumb_exists":false,"bytes":"0","modified":"Wed, 24 Jul 2013 05:12:40 +0000","path":"\/","is_dir":true,"root":"sandbox","icon":"folder","revision":"197449015","is_deleted":false,"hash":"3c466158f2bfa4843cf5c6943d6e3723","contents":[{"size":"0 bytes","rev":"61457890","thumb_exists":false,"bytes":"0","modified":"Wed, 24 Jul 2013 05:12:40 +0000","path":"\/test","is_dir":false,"root":"sandbox","icon":"folder","revision":"197675947","is_deleted":false},{"size":"0 bytes","rev":"db70e84","thumb_exists":false,"bytes":"0","modified":"Wed, 24 Jul 2013 04:46:06 +0000","path":"\/go","is_dir":true,"root":"sandbox","icon":"folder","revision":"197683140","is_deleted":false},{"size":"0 bytes","rev":"af871bd7","thumb_exists":false,"bytes":"0","modified":"Wed, 24 Jul 2013 04:34:23 +0000","path":"\/test2","is_dir":true,"root":"sandbox","icon":"folder","revision":"197677444","is_deleted":false}]}';
    var meta = JSON.parse(json);
    /*
    var meta = null;
    var idoc = dialog.weipanIFrame.contentDocument;
    if( idoc ) {
        dialog.weipanIFrame.style.display = 'none';
        var json = idoc.body.firstElementChild.textContent;
        meta = JSON.parse(json);
    } else {
        dialog.weipanIFrame.style.display = 'inline';
    }
    */

    if( meta ) {
        dialog.setMetaData(dialog.weipanTree.getSelectedItem() || dialog.weipanTree, meta.contents);
    }
}

OpenFileDialog.onInsert = function(e) {
    if( this.doing ) {
        return false;
    }

    if(e.key == 'ok' ) {
        if( this.type == 'computer' ) {
            // check fiel type
            var fileName = this.fileTypeComputerFile.value;
            if( fileName == '' ) {
                this.error.style.display = 'inline';
                this.error.textContent = '请选择文档！';
                return false;
            }

            var ext = fileName.match(/\.([^\.]+)$/)[1].toLowerCase();

            if( ext != 'doc' && ext != 'docx' ) {
                this.error.style.display = 'inline';
                this.error.textContent = '需要doc或者docx文档！';
                return false;
            }

            var iframeIO = new goog.net.IframeIo();
            iframeIO.sendFromForm(this.fileTypeComputerForm, config.appbase + '/Open/Local');
            this.error.style.display = 'inline';
            this.error.textContent = '请稍等...';
            this.doing = true;

            var that = this;
            goog.events.listen(iframeIO, goog.net.EventType.COMPLETE, function(e) {
                that.setVisible(false);
                this.doing = false;

                var res = this.getResponseXml();
                var resText = this.getResponseText();

                if( resText == null ) {
                    var resStr = new XMLSerializer().serializeToString(res.documentElement);
                    G.doc.loadFromString(resStr);
                } else {
                    var errDlg = new InfoDialog();
                    errDlg.info.style.color = '#f00';
                    errDlg.info.textContent = '很抱歉，发生故障了！';
                    errDlg.setVisible(true);
                }
            });

            return false;
        } else if( this.type == 'weipan' ) {

        }
    }
};

OpenFileDialog.onFileTypeSelect = function(e) {
    var type = 'computer';
    if( this.id == 'file-type-computer' ) {
        this.dialog.type = 'computer';
        type = 'computer';
    } else if( this.id == 'file-type-weipan' ) {
        this.dialog.type = 'weipan';
        type = 'weipan';
    }

    var dialog = this.dialog;
    var fileTypeComputerInput = dialog.fileTypeComputer;
    var fileTypeWeipanInput = dialog.fileTypeWeipan;

    if( type == 'computer' ) {
        fileTypeComputerInput.style.display = 'inline';
        fileTypeWeipanInput.style.display = 'none';
    } else if( type == 'weipan' ) {
        fileTypeComputerInput.style.display = 'none';
        fileTypeWeipanInput.style.display = 'inline';
    }
};

var InsertImgDialog = function() {
    var dialog = new goog.ui.Dialog();
    asse(dialog, InsertImgDialog);
    dialog.setBackgroundElementOpacity(0.2);
    var dialogContent = dialog.getContentElement();
    dialogContent.style.width = '500px';

    // image type
    var imgTypeSelect = goog.dom.createDom('div');
    imgTypeSelect.style.webkitUserSelect = 'none';
    imgTypeSelect.style.fontSize = '11px';
    imgTypeSelect.style.margin = '15px 4px 10px 4px';

    var radioComputer = goog.dom.createDom('input');
    radioComputer.type = 'radio';
    radioComputer.name = 'image-type';
    radioComputer.id = 'image-type-computer';
    radioComputer.checked = 'checked';
    var radioComputerSpan = goog.dom.createDom('span');
    radioComputerSpan.textContent = '从电脑上传';
    radioComputerSpan.style.marginRight = '10px';

    var radioURL = goog.dom.createDom('input');
    radioURL.type = 'radio';
    radioURL.name = 'image-type';
    radioURL.id = 'image-type-url';
    var radioURLSpan = goog.dom.createDom('span');
    radioURLSpan.textContent = '输入图片网址';

    imgTypeSelect.appendChild(radioComputer);
    imgTypeSelect.appendChild(radioComputerSpan);
    imgTypeSelect.appendChild(radioURL);
    imgTypeSelect.appendChild(radioURLSpan);

    // image source input
    var imgInput = goog.dom.createDom('div');
    imgInput.style.margin = '5px 5px 10px 7px';
    imgInput.style.fontSize = '11px';
    imgInput.style.height = '25px';

    var imgSourceComputer = goog.dom.createDom('div');
    imgSourceComputer.style.display = 'inline';
    dialog.imgSourceComputer = imgSourceComputer;

    var computecrImgUploadForm = goog.dom.createDom('form');
    computecrImgUploadForm.action = 'upload';
    computecrImgUploadForm.method = 'POST';
    computecrImgUploadForm.enctype = 'multipart/form-data';
    dialog.imgTypeComputerForm = computecrImgUploadForm;

    var imgSourceComputerFile = goog.dom.createDom('input');
    imgSourceComputerFile.type = 'file';
    imgSourceComputerFile.name = 'file';
    dialog.imgSourceComputerFile = imgSourceComputerFile;
    computecrImgUploadForm.appendChild(imgSourceComputerFile);
    imgSourceComputer.appendChild(computecrImgUploadForm);
    radioComputer.dialog = dialog;

    var imgSourceURL = goog.dom.createDom('div');
    imgSourceURL.style.display = 'none';
    dialog.imgSourceURL = imgSourceURL;

    var imgSourceURLSpan = goog.dom.createDom('span');
    imgSourceURLSpan.textContent = '图片网址: ';
    imgSourceURLSpan.style.webkitUserSelect = 'none';
    var imgSourceURLInput = goog.dom.createDom('input');
    dialog.URLInput = imgSourceURLInput;
    imgSourceURLInput.type = 'text';
    imgSourceURLInput.style.width = '410px';
    imgSourceURLInput.style.border = '1px solid #ccc';
    //imgSourceURLInput.value = 'http://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png';
    imgSourceURL.appendChild(imgSourceURLSpan);
    imgSourceURLSpan.appendChild(imgSourceURLInput);
    radioURL.dialog = dialog;

    imgInput.appendChild(imgSourceComputer);
    imgInput.appendChild(imgSourceURL);

    // error line
    var dialogErrLine = goog.dom.createDom('div');
    dialogErrLine.style.display = 'none';
    dialogErrLine.style.color = '#fff';
    dialogErrLine.style.backgroundColor = '#EB8257';
    dialogErrLine.style.fontSize = '11px';
    dialogErrLine.style.marginLeft = '11px';
    dialogErrLine.style.padding = '5px';
    dialogErrLine.style.webkitUserSelect = 'none';
    dialog.error = dialogErrLine;

    dialogContent.appendChild(imgTypeSelect);
    dialogContent.appendChild(imgInput);
    dialogContent.appendChild(dialogErrLine);

    dialog.setTitle('插入图片');
    dialog.type = 'computer';

    goog.events.listen(radioComputer, goog.events.EventType.CLICK, dialog.onImgSourceTypeSelect);
    goog.events.listen(radioURL, goog.events.EventType.CLICK, dialog.onImgSourceTypeSelect);

    var dialogButtonSet = dialog.getButtonSet();
    var okBtn = dialogButtonSet.getButton('ok');
    var cancelBtn = dialogButtonSet.getButton('cancel');
    okBtn.textContent = '插入';
    cancelBtn.textContent = '取消';

    goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, dialog.onInsert);

    return dialog;
};

InsertImgDialog.onInsert = function(e) {
    if( this.doing ) {
        return false;
    }

    if(e.key == 'ok' ) {
        if( this.type == 'computer' ) {
            // check file type
            var fileName = this.imgSourceComputerFile.value;
            if( fileName == '' ) {
                this.error.style.display = 'inline';
                this.error.textContent = '请选择图片！';
                return false;
            }

            var ext = fileName.match(/\.([^\.]+)$/)[1].toLowerCase();

            if( ext != 'jpg' && ext != 'jpeg' && ext != 'png' ) {
                this.error.style.display = 'inline';
                this.error.textContent = '需要jpeg或者png图片！';
                return false;
            }

            var iframeIO = new goog.net.IframeIo();
            iframeIO.sendFromForm(this.imgTypeComputerForm, config.appbase + '/Insert/LocalImage');
            this.error.style.display = 'inline';
            this.error.textContent = '请稍等...';
            this.doing = true;

            var that = this;
            goog.events.listen(iframeIO, goog.net.EventType.COMPLETE, function(e) {
                that.setVisible(false);
                this.doing = false;

                var resText = this.getResponseText();

                if( resText != 'error' ) {
                    G.doc.inputImageBefor(resText, null, G.cursor.target, true);
                    G.cursor.refreshTarget();
                } else {
                    var errDlg = new InfoDialog();
                    errDlg.info.style.color = '#f00';
                    errDlg.info.textContent = '很抱歉，发生故障了！';
                    errDlg.setVisible(true);
                }
            });

            return false;
        } else if( this.type == 'url' ) {
            G.doc.inputImageBefor(this.URLInput.value, null, G.cursor.target, true);
            G.cursor.refreshTarget();
        }
    }

    if(e.key == 'ok' ) {

    }
};

InsertImgDialog.onImgSourceTypeSelect = function(e) {
    var type = 'computer';
    if( this.id == 'image-type-computer' ) {
        type = 'computer';
        this.dialog.type = 'computer';
    } else if( this.id == 'image-type-url' ) {
        type = 'url';
        this.dialog.type = 'url';
    }

    var dialog = this.dialog;
    var imgSourceComputerInput = dialog.imgSourceComputer;
    var imgSourceURLInput = dialog.imgSourceURL;

    if( type == 'computer' ) {
        imgSourceComputerInput.style.display = 'inline';
        imgSourceURLInput.style.display = 'none';
    } else if( type == 'url' ) {
        imgSourceComputerInput.style.display = 'none';
        imgSourceURLInput.style.display = 'inline';
    }
};

//---------------------------------------------------------------------------------------------------------------------- inline block style
var BlockStyle = function(fontFamily, fontSize, color) {
    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.color = color;

    this.backgroundColor = 'transparent';
    this.letterSpacing = 'normal';
    this.fontWeight = 'normal'; // bold
    this.fontStyle = 'normal';  // italic
    this.textDecoration = 'none'; // underline
    this.script = 'normal'; // superscript, subscript
}

BlockStyle.prototype.setScript = function(script) {
    this.script= script;
    if( script != 'normal' ) {
        this.fontSize = 'xx-small';
    }
}

BlockStyle.prototype.equals = function(other) {
    var f1 = this.fontFamily.replace(/'/g, '');
    var f2 = other.fontFamily.replace(/'/g,'');
    var c1 = this.color, c2 = other.color;

    if( f1 != f2 || !isColorEqual(c1, c2) || this.fontSize != other.fontSize ||
            !isColorEqual(this.backgroundColor, other.backgroundColor) ||
            this.fontWeight != other.fontWeight ||
            this.fontStyle != other.fontStyle ||
            this.textDecoration != other.textDecoration ||
            this.script != other.script ||
            this.letterSpacing != other.letterSpacing
        ) {
        return false;
    }

    return true;
};

//---------------------------------------------------------------------------------------------------------------------- inline EOP
// end of a paragraph
var InlineEOP = function() {
    var ele = goog.dom.createDom('span');
    ele.className = 'oar-inline-eop';
    ele.style.visibility = 'hidden';
    ele.textContent = '¶';
    ele.overlay = {si: -1, ei: -1};
    asse(ele, InlineBlock);
    return ele;
}

//---------------------------------------------------------------------------------------------------------------------- inline block
// sequence of character with same style
var LH = function(l, h) {
    this.l = l;
    this.h = h;
};
var ILH = function(i, l, h) {
    this.i = i;
    this.l = l;
    this.h = h;
};

var InlineBlock = function() {
    var ele = goog.dom.createDom('span');
    ele.className = 'oar-inline-block';
    ele.style.whiteSpace = 'nowrap';
    ele.script = 'normal';
    ele.overlay = {si: -1, ei: -1};
    asse(ele, InlineBlock);
    return ele;
};

InlineBlock.setBlockStyle = function(style) {
    var blackColor = '#000000';
    var whiteColor = 'rgb(255, 255, 255)';

    this.style.fontFamily = style.fontFamily;
    this.style.fontSize = style.fontSize;
    this.style.color = style.color == null ? blackColor : style.color;

    this.style.backgroundColor = style.backgroundColor == null ? 'transparent' : style.backgroundColor;
    this.style.fontWeight = style.fontWeight;
    this.style.fontStyle  = style.fontStyle;
    this.style.textDecoration = style.textDecoration;
    this.style.letterSpacing = style.letterSpacing;

    if( style.script == 'superscript' ) {
        this.script = 'superscript';
        this.style.fontSize = 'xx-small';
        this.style.verticalAlign = 'top';
    } else if ( style.script == 'subscript' ) {
        this.script = 'subscript';
        this.style.fontSize = 'xx-small';
        this.style.verticalAlign = 'bottom';
    } else if( style.script == 'normal' ) {
        this.script = 'normal';
        this.style.verticalAlign = 'baseline';
    }
}

InlineBlock.getBlockStyle = function() {
    var style = new BlockStyle(this.style.fontFamily, this.style.fontSize, this.style.color);
    style.backgroundColor = this.style.backgroundColor;
    style.fontWeight = this.style.fontWeight;
    style.fontStyle = this.style.fontStyle;
    style.textDecoration = this.style.textDecoration;
    style.letterSpacing = this.style.letterSpacing;
    style.script = this.script;

    return style;
}

InlineBlock.getLHFromI = function(i) {
    if( i == 0 ) {
        return new LH(0, this.offsetHeight);
    }

    var text = this.textContent.substring(0, i);
    var cf = getComputedFontStyle(this);
    var fontFamily = cf.family;
    var fontSize = cf.size;
    var fontWeight = cf.weight;
    var m = measureFontTextWH(text, fontFamily, fontSize, fontWeight);
    return new LH(m.w, m.h);
}

InlineBlock.getILHFromPosition = function(x, y) {
    var d = 0, l = 0 ,h = 0;
    var text = this.textContent;
    d = text.length - 1;
    var cf = getComputedFontStyle(this);
    var fontFamily = cf.family;
    var fontSize = cf.size;
    var fontWeight = cf.weight;
    var m = measureFontTextWH(text.substr(0, text.length -1), fontFamily, fontSize, fontWeight);
    l = m.w;
    h = m.h;

    var lp = getContainerOffset(this);
    var top = lp.top;
    var left = lp.left;
    if( left > x || left + this.offsetWidth < x
        /*|| top > y || top + this.offsetHeight < y*/) {
        h = h == 0 ? this.offsetHeight : h;
        return new ILH(d, l, h);
    }

    var difX = x - left;
    var cf = getComputedFontStyle(this);
    var fontFamily = cf.family;
    var fontSize = cf.size;
    var fontWeight = cf.weight;

    var preW = 0;
    for( var i = 1; i <= text.length; ++i ) {
        var sub = text.substr(0, i);
        var subm = measureFontTextWH(sub, fontFamily, fontSize, fontWeight);
        var subw = subm.w;
        d = i - 1;
        if( subw > difX ) {
            break;
        }
        preW = subw;
    }

    h = h == 0 ? this.offsetHeight : h;
    l = preW;

    return new ILH(d, l, h);
}
//---------------------------------------------------------------------------------------------------------------------- inline image
// image resizer
var InlineImageResizer = function(target) {
    var root = goog.dom.createDom('div');
    root.style.widht = '0px';
    root.style.height = '0px';
    root.className = 'oar-inline-image-resizer';

    var targetLT = getContainerOffset(target);
    var ele = goog.dom.createDom('div');
    ele.style.border = '1px solid #0096fd';
    ele.style.position = 'absolute';
    ele.style.left = targetLT.left + 'px';
    ele.style.top = targetLT.top + 'px';
    ele.style.width = target.offsetWidth + 'px';
    ele.style.height = target.offsetHeight + 'px';

    asse(root, InlineImageResizer);
    root.appendChild(ele);
    root.box = ele;
    root.target = target;

    // 8 handlers
    var handlerNE = goog.dom.createDom('div');
    root.NE = handlerNE;
    handlerNE.className = 'oar-inline-image-resizer-ne';
    handlerNE.style.backgroundColor = '#0096fd';
    handlerNE.style.width = '6px';
    handlerNE.style.height = '6px';
    handlerNE.style.position = 'absolute';
    handlerNE.style.left = targetLT.left + target.offsetWidth - 3 + 'px';
    handlerNE.style.top = targetLT.top - 3 + 'px';
    handlerNE.style.cursor = 'ne-resize'
    root.appendChild(handlerNE);

    var handlerEE = goog.dom.createDom('div');
    root.EE = handlerEE;
    handlerEE.className = 'oar-inline-image-resizer-ee';
    handlerEE.style.backgroundColor = '#0096fd';
    handlerEE.style.width = '6px';
    handlerEE.style.height = '6px';
    handlerEE.style.position = 'absolute';
    handlerEE.style.left = targetLT.left + target.offsetWidth - 3 + 'px';
    handlerEE.style.top = targetLT.top + target.offsetHeight / 2 - 3 + 'px';
    handlerEE.style.cursor = 'e-resize'
    root.appendChild(handlerEE);

    var handlerSE = goog.dom.createDom('div');
    root.SE = handlerSE;
    handlerSE.className = 'oar-inline-image-resizer-se';
    handlerSE.style.backgroundColor = '#0096fd';
    handlerSE.style.width = '6px';
    handlerSE.style.height = '6px';
    handlerSE.style.position = 'absolute';
    handlerSE.style.left = targetLT.left + target.offsetWidth - 3 + 'px';
    handlerSE.style.top = targetLT.top + target.offsetHeight - 3 + 'px';
    handlerSE.style.cursor = 'se-resize'
    root.appendChild(handlerSE);

    var handlerSS = goog.dom.createDom('div');
    root.SS = handlerSS;
    handlerSS.className = 'oar-inline-image-resizer-ss';
    handlerSS.style.backgroundColor = '#0096fd';
    handlerSS.style.width = '6px';
    handlerSS.style.height = '6px';
    handlerSS.style.position = 'absolute';
    handlerSS.style.left = targetLT.left + target.offsetWidth / 2 - 3 + 'px';
    handlerSS.style.top = targetLT.top + target.offsetHeight - 3 + 'px';
    handlerSS.style.cursor = 's-resize'
    root.appendChild(handlerSS);

    var handlerSW = goog.dom.createDom('div');
    root.SW = handlerSW;
    handlerSW.className = 'oar-inline-image-resizer-sw';
    handlerSW.style.backgroundColor = '#0096fd';
    handlerSW.style.width = '6px';
    handlerSW.style.height = '6px';
    handlerSW.style.position = 'absolute';
    handlerSW.style.left = targetLT.left - 3 + 'px';
    handlerSW.style.top = targetLT.top + target.offsetHeight - 3 + 'px';
    handlerSW.style.cursor = 'sw-resize'
    root.appendChild(handlerSW);

    var handlerWW = goog.dom.createDom('div');
    root.WW = handlerWW;
    handlerWW.className = 'oar-inline-image-resizer-ww';
    handlerWW.style.backgroundColor = '#0096fd';
    handlerWW.style.width = '6px';
    handlerWW.style.height = '6px';
    handlerWW.style.position = 'absolute';
    handlerWW.style.left = targetLT.left - 3 + 'px';
    handlerWW.style.top = targetLT.top + target.offsetHeight / 2 - 3 + 'px';
    handlerWW.style.cursor = 'w-resize'
    root.appendChild(handlerWW);

    var handlerNW = goog.dom.createDom('div');
    root.NW = handlerNW;
    handlerNW.className = 'oar-inline-image-resizer-nw';
    handlerNW.style.backgroundColor = '#0096fd';
    handlerNW.style.width = '6px';
    handlerNW.style.height = '6px';
    handlerNW.style.position = 'absolute';
    handlerNW.style.left = targetLT.left - 3 + 'px';
    handlerNW.style.top = targetLT.top - 3 + 'px';
    handlerNW.style.cursor = 'nw-resize'
    root.appendChild(handlerNW);

    var handlerNN = goog.dom.createDom('div');
    root.NN = handlerNN;
    handlerNN.className = 'oar-inline-image-resizer-nn';
    handlerNN.style.backgroundColor = '#0096fd';
    handlerNN.style.width = '6px';
    handlerNN.style.height = '6px';
    handlerNN.style.position = 'absolute';
    handlerNN.style.left = targetLT.left + target.offsetWidth / 2 - 3 + 'px';
    handlerNN.style.top = targetLT.top - 3 + 'px';
    handlerNN.style.cursor = 'n-resize'
    root.appendChild(handlerNN);

    goog.events.listen(root.NN, goog.events.EventType.MOUSEDOWN, root.onMouseDown);
    goog.events.listen(root.SS, goog.events.EventType.MOUSEDOWN, root.onMouseDown);
    goog.events.listen(root.EE, goog.events.EventType.MOUSEDOWN, root.onMouseDown);
    goog.events.listen(root.WW, goog.events.EventType.MOUSEDOWN, root.onMouseDown);
    goog.events.listen(root.NW, goog.events.EventType.MOUSEDOWN, root.onMouseDown);
    goog.events.listen(root.NE, goog.events.EventType.MOUSEDOWN, root.onMouseDown);
    goog.events.listen(root.SW, goog.events.EventType.MOUSEDOWN, root.onMouseDown);
    goog.events.listen(root.SE, goog.events.EventType.MOUSEDOWN, root.onMouseDown);

    return root;
};

InlineImageResizer.setTarget = function(target) {
    var targetLT = getContainerOffset(target);
    this.target = target;

    this.box.style.left = targetLT.left + 'px';
    this.box.style.top = targetLT.top + 'px';
    this.box.style.width = target.offsetWidth + 'px';
    this.box.style.height = target.offsetHeight + 'px';

    // 8 handlers
    this.NE.style.left = targetLT.left + target.offsetWidth - 3 + 'px';
    this.NE.style.top = targetLT.top - 3 + 'px';

    this.EE.style.left = targetLT.left + target.offsetWidth - 3 + 'px';
    this.EE.style.top = targetLT.top + target.offsetHeight / 2 - 3 + 'px';

    this.SE.style.left = targetLT.left + target.offsetWidth - 3 + 'px';
    this.SE.style.top = targetLT.top + target.offsetHeight - 3 + 'px';

    this.SS.style.left = targetLT.left + target.offsetWidth / 2 - 3 + 'px';
    this.SS.style.top = targetLT.top + target.offsetHeight - 3 + 'px';

    this.SW.style.left = targetLT.left - 3 + 'px';
    this.SW.style.top = targetLT.top + target.offsetHeight - 3 + 'px';

    this.WW.style.left = targetLT.left - 3 + 'px';
    this.WW.style.top = targetLT.top + target.offsetHeight / 2 - 3 + 'px';

    this.NW.style.left = targetLT.left - 3 + 'px';
    this.NW.style.top = targetLT.top - 3 + 'px';

    this.NN.style.left = targetLT.left + target.offsetWidth / 2 - 3 + 'px';
    this.NN.style.top = targetLT.top - 3 + 'px';
};

InlineImageResizer.onMouseDown = function(e) {
    var d = new goog.fx.Dragger(this);
    var root = goog.dom.getParentElement(this);
    var box = root.box;
    var handler = this;

    d.addEventListener(goog.fx.Dragger.EventType.DRAG, function(e) {
        var left = Math.min(root.NW.offsetLeft, root.WW.offsetLeft, root.SW.offsetLeft);
        var top = Math.min(root.NE.offsetTop, root.NN.offsetTop, root.NW.offsetTop);
        var right = Math.max(root.NE.offsetLeft, root.EE.offsetLeft, root.SE.offsetLeft);
        var bottom = Math.max(root.SW.offsetTop, root.SS.offsetTop, root.SE.offsetTop);

        if( handler == root.NW ) {
            left = handler.offsetLeft;
            //top = handler.offsetTop;
            top = root.SW.offsetTop - (box.offsetHeight / box.offsetWidth) * (right - left);
        } else if( handler == root.NN ) {
            top = handler.offsetTop;
        } else if( handler == root.NE ) {
            right = handler.offsetLeft;
            //top = handler.offsetTop;
            top = root.SW.offsetTop - (box.offsetHeight / box.offsetWidth) * (right - left);
        } else if( handler == root.EE ) {
            right = handler.offsetLeft;
        } else if( handler == root.SE ) {
            right = handler.offsetLeft;
            //bottom = handler.offsetTop;
            bottom = root.NW.offsetTop + (box.offsetHeight / box.offsetWidth) * (right - left);
        } else if( handler == root.SS ) {
            bottom = handler.offsetTop;
        } else if( handler == root.SW ) {
            left = handler.offsetLeft;
            //bottom = handler.offsetTop;
            bottom = root.NW.offsetTop + (box.offsetHeight / box.offsetWidth) * (right - left);
        } else if( handler == root.WW ) {
            left = handler.offsetLeft;
        }

        var width = right - left;
        var height = bottom - top;

        root.style.width = width + 'px';
        root.style.height = height + 'px';

        var targetSpan = goog.dom.getParentElement(root.target);
        var targetLineC = goog.dom.getParentElement(targetSpan);
        var targetLine = goog.dom.getParentElement(targetLineC);
        if( width >= targetLine.getMaxWidth() ) {
            width = targetLine.getMaxWidth() - 10;
        }
        //
        root.NW.style.left = left + 'px';
        root.NW.style.top = top + 'px';

        root.NN.style.left = left + width / 2 + 'px';
        root.NN.style.top = top + 'px';

        root.NE.style.left = left + width + 'px';
        root.NE.style.top = top + 'px';

        root.EE.style.left = left + width + 'px';
        root.EE.style.top = top + height /2 + 'px';

        root.SE.style.left = left + width +  'px';
        root.SE.style.top = top + height + 'px';

        root.SS.style.left = left + width / 2 +'px';
        root.SS.style.top = top + height + 'px';

        root.SW.style.left = left + 'px';
        root.SW.style.top = top + height + 'px';

        root.WW.style.left = left + 'px';
        root.WW.style.top = top + height / 2 + 'px';

        box.style.left = (left + 3) + 'px';
        box.style.top = (top + 3) + 'px';
        box.style.width = width + 'px';
        box.style.height = height + 'px';
    });
    d.addEventListener(goog.fx.Dragger.EventType.END, function(e) {
        var left = Math.min(root.NW.offsetLeft, root.WW.offsetLeft, root.SW.offsetLeft);
        var top = Math.min(root.NE.offsetTop, root.NN.offsetTop, root.NW.offsetTop);
        var right = Math.max(root.NE.offsetLeft, root.EE.offsetLeft, root.SE.offsetLeft);
        var bottom = Math.max(root.SW.offsetTop, root.SS.offsetTop, root.SE.offsetTop);

        if( handler == root.NW ) {
            left = handler.offsetLeft;
            top = handler.offsetTop;
        } else if( handler == root.NN ) {
            top = handler.offsetTop;
        } else if( handler == root.NE ) {
            right = handler.offsetLeft;
            top = handler.offsetTop;
        } else if( handler == root.EE ) {
            right = handler.offsetLeft;
        } else if( handler == root.SE ) {
            right = handler.offsetLeft;
            bottom = handler.offsetTop;
        } else if( handler == root.SS ) {
            bottom = handler.offsetTop;
        } else if( handler == root.SW ) {
            left = handler.offsetLeft;
            bottom = handler.offsetTop;
        } else if( handler == root.WW ) {
            left = handler.offsetLeft;
        }

        var width = right - left;
        var height = bottom - top;

        root.style.height = height + 'px';
        root.style.width = width + 'px';

        // resize image
        root.target.style.width = width + 'px';
        root.target.style.height = height + 'px';

        // reset reiszer position
        var targetTL = getContainerOffset(root.target);
        left = targetTL.left;
        top = targetTL.top;
        width = root.target.offsetWidth;
        height = root.target.offsetHeight;

        root.NW.style.left = left + 'px';
        root.NW.style.top = top + 'px';

        root.NN.style.left = left + width / 2 + 'px';
        root.NN.style.top = top + 'px';

        root.NE.style.left = left + width + 'px';
        root.NE.style.top = top + 'px';

        root.EE.style.left = left + width + 'px';
        root.EE.style.top = top + height /2 + 'px';

        root.SE.style.left = left + width +  'px';
        root.SE.style.top = top + height + 'px';

        root.SS.style.left = left + width / 2 +'px';
        root.SS.style.top = top + height + 'px';

        root.SW.style.left = left + 'px';
        root.SW.style.top = top + height + 'px';

        root.WW.style.left = left + 'px';
        root.WW.style.top = top + height / 2 + 'px';

        box.style.left = (left + 3) + 'px';
        box.style.top = (top + 3) + 'px';
        box.style.width = width + 'px';
        box.style.height = height + 'px';

        d.dispose();
        G.cursor.refreshTarget();

        var lineC = goog.dom.getParentElement(G.cursor.target.inline);
        var line = goog.dom.getParentElement(lineC);
        var para = goog.dom.getParentElement(line);
        var cell = goog.dom.getParentElement(para);
        var topPage = cell.getTopPage();
        line.handleOverflow();
        line.handleWidthLack();
        topPage.handleOverflow();
        topPage.handleWidthLack();
    });
    d.startDrag(e);
}

// one image in a line
var InlineImage  = function() {
    var ele = goog.dom.createDom('span');
    ele.className = 'oar-inline-image';
    ele.style.whiteSpace = 'nowrap';
    ele.overlay = {si: -1, ei: -1};
    asse(ele, InlineImage);

    var img = goog.dom.createDom('img');
    img.className = 'oar-inline-image-content';
    ele.image = img;
    ele.appendChild(img);

    ele.resizer = null;
    goog.events.listen(ele, goog.events.EventType.CLICK, ele.onClick);
    goog.events.listen(ele, goog.events.EventType.BLUR, function(e) {
        this.style.visibility = 'hidden';
    });
    goog.events.listen(img, goog.events.EventType.LOAD, ele.onLoad);

    return ele;
};
InlineImage.onLoad = function(e) {
    var imgSpan = goog.dom.getParentElement(this);
    var lineC = goog.dom.getParentElement(imgSpan);
    var line = goog.dom.getParentElement(lineC);

    if( this.offsetWidth > line.offsetWidth ) {
        this.style.width = line.offsetWidth - 10 + 'px';
    }

    if( this.offsetHeight > line.offsetHeight ) {
        this.style.height = line.offsetHeight - 2 + 'px';
    }

    line.handleOverflow();
    var para = goog.dom.getParentElement(line);
    var cell = goog.dom.getParentElement(para);
    var page = cell.getTopPage();
    page.handleOverflow();

    G.cursor.refreshTarget();
}

InlineImage.onClick = function(e) {
    if( G.iamgeResizer ) {
        this.resizer = G.iamgeResizer;
        G.iamgeResizer.setTarget(this.image);
        G.iamgeResizer.style.visibility = 'visible';
    } else {
        var resizer = new InlineImageResizer(this.image);
        G.doc.appendChild(resizer);
        G.iamgeResizer = resizer;
        this.resizer = resizer;
    }
}

InlineImage.getSource = function() {
    return this.image.src;
}

InlineImage.setSource = function(src) {
    this.image.src = src;
}

InlineImage.setSize = function(width, height) {
    this.image.style.width = width + 'px';
    this.image.style.height = height + 'px';
}

InlineImage.getSize = function() {
    return {w:this.image.offsetWidth, h:this.image.offsetHeight};
}

//---------------------------------------------------------------------------------------------------------------------- inline selection overlay
// selection overlay in a line
var InlineSelectionOverlay = function() {

};

//---------------------------------------------------------------------------------------------------------------------- line
var LineStyle = function() {
    this.leftIndent = 0;
    this.rightIndent = 0;
    this.lineSpacing = 3;
}

var Line = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-line';
    ele.lineStyle = null;
    asse(ele, Line);

    var eleContent = goog.dom.createDom('div');
    eleContent.className = 'oar-line-content';
    goog.dom.appendChild(ele, eleContent);
    ele.content = eleContent;

    ele.childrenEle = [];
    ele.setLineStyle(new LineStyle());
    return ele;
};

Line.hasOverlay = function() {
    var bh = false;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        var block = this.childrenEle[i];
        if( block.className && block.className.lastIndexOf('oar-inline-') > -1 ) {
            if( block.overlay.si >= 0 ) {
                bh = true;
                break;
            }
        }
    }

    return bh;
}

// left and right against to line
Line.CreateOverlay = function(left, right) {
    this.MarkBlockOverlayInRange(left, right);
    this.CreateOverlayLayer();
};

Line.ClearOverlay = function() {
    this.ClearBlockOverlayMark();
    this.ClearOverlayLayer();
};

Line.refreshOverlayLayer = function() {
    this.ClearOverlayLayer();
    this.CreateOverlayLayer();
}

Line.MarkBlockOverlayInRange = function(left, right) {
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        var block = this.childrenEle[i];
        if( block.className && block.className.lastIndexOf('oar-inline-') > -1 ) {
            var bLeft = block.offsetLeft - this.offsetLeft;
            if( bLeft < right && bLeft + block.offsetWidth > left ) {
                // block in range
                if( block.className == 'oar-inline-image' ) {
                    block.overlay.si = 0;
                    block.overlay.ei = 0;
                } else if( block.className == 'oar-inline-eop' ) {
                    block.overlay.si = 0;
                    block.overlay.ei = 0;
                } else if( block.className == 'oar-inline-block' ) {
                    var text = block.textContent;
                    var bS = false;
                    for( var ti = 0; ti < text.length; ++ti ) {
                        var subText = text.substring(0, ti + 1);
                        var textStyle = block.getBlockStyle();
                        var subTextW = measureFontTextWH(subText, textStyle.fontFamily, textStyle.fontSize, textStyle.fontWeight).w;
                        var subTextR = bLeft + subTextW;
                        if( bS == false && subTextR > left ) {
                            block.overlay.si = ti;
                            block.overlay.ei = ti;
                            bS = true;
                            continue;
                        }

                        if( bS == true ) {
                            if( subTextR <= right ) {
                                block.overlay.ei = ti;
                            } else {
                                block.overlay.ei = ti - 1;
                                i = this.childrenEle.length;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
};

Line.ClearBlockOverlayMark = function() {
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        var block = this.childrenEle[i];
        if( block.className && block.className.lastIndexOf('oar-inline-') > -1 ) {
            block.overlay.si = -1;
            block.overlay.ei = -1;
        }
    }
};

Line.CreateOverlayLayer = function() {
    this.ClearOverlayLayer();

    var overLeft = this.offsetLeft;
    var overRight = this.offsetLeft;
    var bSetLeft = false;

    for( var i = 0; i < this.childrenEle.length; ++i ) {
        var block = this.childrenEle[i];
        if( block.className && block.className.lastIndexOf('oar-inline-') > -1 && block.overlay.si >= 0 ) {
            if( block.className == 'oar-inline-image' ) {
                if( bSetLeft == false ) {
                    overLeft = block.offsetLeft;
                    bSetLeft = true;
                }

                overRight = block.offsetLeft + block.offsetWidth;
            } else if( block.className == 'oar-inline-eop' ) {
                if( bSetLeft == false ) {
                    overLeft = block.offsetLeft;
                    bSetLeft = true;
                }

                overRight = block.offsetLeft + block.offsetWidth;
            } else if( block.className == 'oar-inline-block' ) {
                if( bSetLeft == false ) {
                    var textLeft = block.textContent.substring(0, block.overlay.si);
                    var textStyle = block.getBlockStyle();
                    var textLeftW = measureFontTextWH(textLeft, textStyle.fontFamily, textStyle.fontSize, textStyle.fontWeight).w;
                    overLeft = block.offsetLeft + textLeftW;
                    bSetLeft = true;
                }

                var textRight = block.textContent.substring(0, block.overlay.ei + 1);
                var textStyle = block.getBlockStyle();
                var textRightW = measureFontTextWH(textRight, textStyle.fontFamily, textStyle.fontSize, textStyle.fontWeight).w;
                overRight = block.offsetLeft + textRightW;
            }
        }
    }

    var overlay = goog.dom.createDom('div');
    this.appendChild(overlay);

    // overLeft and overRight is against to line's parent offset
    var difX = 0;
    var difY = 0;
    var lpo = this.offsetParent;
    if( lpo.tagName.toLowerCase() == 'td' ) {
        var lpoTL = getContainerOffset(lpo);
        var lpoPage = this.getPage();
        var lpoPageTL = getContainerOffset(lpoPage);
        difX = lpoTL.left - lpoPageTL.left;
        difY = lpoTL.top - lpoPageTL.top;
    }

    overlay.className = 'oar-inline-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = difX + overLeft + 'px';
    overlay.style.top = difY + this.offsetTop + 'px';
    overlay.style.width = (overRight - overLeft) + 'px';
    overlay.style.height = this.offsetHeight + 'px';
    overlay.style.backgroundColor = '#07f';
    overlay.style.opacity = 0.3;
};

Line.ClearOverlayLayer = function() {
    var oldOverlay = this.getElementsByClassName('oar-inline-overlay')[0];
    if( oldOverlay ) {
        goog.dom.removeNode(oldOverlay);
    }
};

Line.setLineStyle = function(lineStyle) {
    this.lineStyle = lineStyle;

    this.style.marginLeft = lineStyle.leftIndent + 'px';
    this.style.marginRight = lineStyle.rightIndent + 'px';
    this.handleLineSpacing();
}

Line.handleLineSpacing = function() {
    this.style.paddingBottom = this.lineStyle.lineSpacing + 'px';
}

Line.getLineStyle = function() {
    return this.lineStyle;
}

Line.getMaxWidth = function() {
    var para = goog.dom.getParentElement(this);
    var cell = goog.dom.getParentElement(para);
    var pc = goog.dom.getParentElement(cell);

    if( pc.className == 'oar-page-editorpane' ) {
        return cell.offsetWidth;
    } else if( pc.tagName.toLowerCase() == 'td' ){
        if( pc.style.width ) {
            return pc.style.width.replace(/px/g, '');
        } else {
            return pc.offsetWidth;
        }
    }

    //return this.offsetWidth;
};

Line.getChildrenWidth = function() {
    var ws = 0;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        var child = this.childrenEle[i];
        if( child.className != 'oar-inline-eop' ) {
            ws += child.offsetWidth;
        }
    }

    return ws;
}

Line.getChildrenWidthEOP = function() {
    var ws = 0;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        var child = this.childrenEle[i];
        if( child.className != 'oar-inline-' ) {
            ws += child.offsetWidth;
        }
    }

    return ws;
};

Line.getNextLineThroughPageTdAvoidTable = function() {
    var n0 = goog.dom.getNextElementSibling(this);
    if( n0 && n0.className == 'oar-line' ) {
        return n0;
    } else {
        // if no
        var para = goog.dom.getParentElement(this);
        var npara = goog.dom.getNextElementSibling(para);
        while( npara && npara.className != 'oar-paragraph' ) {
            npara = goog.dom.getNextElementSibling(npara);
        }

        if( npara ) {
            nextLine = npara.childrenEle[0];
            return nextLine;

        } else {
            var cell = goog.dom.getParentElement(para);
            var pane = goog.dom.getParentElement(cell);
            if( pane.className == 'oar-page-editorpane' ) {
                // next page's line
                var page = goog.dom.getParentElement(pane);
                var nextPage = goog.dom.getNextElementSibling(page);
                var nextPara = null;
                var nextLine = null;

                while(nextPara == null) {
                    if( nextPage != null && nextPage.className == 'oar-page' ) {
                        for( var i = 0; i < nextPage.childrenEle.length; ++i ) {
                            if( nextPage.childrenEle[i].className == 'oar-paragraph' ) {
                                nextPara = nextPage.childrenEle[i];
                                break;
                            }
                        }
                    } else {
                        return null;
                    }
                    nextPage = goog.dom.getNextElementSibling(nextPage);
                }

                if( nextPara ) {
                    nextLine = nextPara.childrenEle[0];
                }

                return nextLine;
            } else {
                // pane is a td
                var tb = goog.dom.getParentElement(pane);
                while( tb && tb.tagName.toLowerCase() != 'table' ) {
                    tb = goog.dom.getParentElement(tb);
                }

                if( tb ) {
                    var ccri = -1;
                    var ccci = -1;
                    for( var ri = 0; ri < tb.rows.length; ++ri ) {
                        for( var ci = 0; ci < tb.rows[ri].cells.length; ++ci ) {
                            var cc = tb.rows[ri].cells[ci];
                                if( cc == pane ) {
                                    ccri = ri;
                                    ccci = ci;
                                    break;
                                }
                        }
                    }

                    if( ccri != -1 && ccci != -1 ) {
                        if( ccci == tb.rows[ccri].cells.length -1 ) {
                            if( ccri + 1 < tb.rows.length ) {
                                var ncc = tb.rows[ccri + 1].cells[0];
                                if( ncc == null ) {
                                    return null;
                                }

                                var ncc2 = ncc.getElementsByClassName('oar-pta-cell')[0];
                                var nccp = ncc2.childrenEle[0];
                                var nccpl = nccp.childrenEle[0];
                                return nccpl;
                            } else {
                                return null;
                            }

                        } else {
                            var ncc = tb.rows[ccri].cells[ccci + 1];
                            var ncc2 = ncc.getElementsByClassName('oar-pta-cell')[0];
                            var nccp = ncc2.childrenEle[0];
                            var nccpl = nccp.childrenEle[0];
                            return nccpl;
                        }
                    }
                } else {
                    return null;
                }
            }
        }
    }
};

Line.getPage = function() {
    var para = goog.dom.getParentElement(this);
    var cell = goog.dom.getParentElement(para);
    var page = cell.getTopPage();

    return page;
}

Line.getParagraphNextLine = function() {
    var n0 = goog.dom.getNextElementSibling(this);
    if( n0 ) {
        return n0;
    } else {
        // if no
        var lastBlock = this.childrenEle[this.childrenEle.length - 1];
        if( lastBlock.className == 'oar-inline-eop' ) {
            return null;
        } else {
            var para = goog.dom.getParentElement(this);
            var cell = goog.dom.getParentElement(para);
            var pane = goog.dom.getParentElement(cell);
            if( pane.className == 'oar-page-editorpane' ) {
                // next page's line
                var page = goog.dom.getParentElement(pane);
                var nextPage = goog.dom.getNextElementSibling(page);
                var nextPara = null;
                var nextLine = null;

                if( nextPage != null ) {
                    for( var i = 0; i < nextPage.childrenEle.length; ++i ) {
                        if( nextPage.childrenEle[i].className == 'oar-paragraph' ) {
                            nextPara = nextPage.childrenEle[i];
                            break;
                        }
                    }
                }

                if( nextPara ) {
                    nextLine = nextPara.childrenEle[0];
                }

                return nextLine;
            } else {
                return null;
            }
        }
    }

};

Line.handleWidthLack = function() {
    var cursorTargetDelta = null; // help adjust cursor target

    var maxWidth = this.getMaxWidth();
    var childrenWidth = this.getChildrenWidth();
    var difW = maxWidth - childrenWidth;

    var nextLine = goog.dom.getNextElementSibling(this);
    var lst = this.childrenEle[this.childrenEle.length - 1];
    var remedyBlock = [];

    var bThisLine = true;


    while( bThisLine ) {
        // find next line
        if( nextLine == null && (lst == null || (lst && lst.className != 'oar-inline-eop')) ) {
            var para = goog.dom.getParentElement(this);
            var nextPara = goog.dom.getNextElementSibling(para);

            if( nextPara != null && nextPara.className == 'oar-paragraph' ) {
                var firstLine = nextPara.childrenEle[0];
                nextLine = firstLine;
            } else if ( nextPara != null && nextPara.className == 'oar-table' ) {
                nextLine = null;
            } else {
                // next page's first paragraph
                var cell = goog.dom.getParentElement(para);
                var pc = goog.dom.getParentElement(cell);
                if( pc.className == 'oar-page-editorpane' ) {
                    var page = goog.dom.getParentElement(pc);
                    var nextPage = goog.dom.getNextElementSibling(page);

                    if( nextPage ) {
                        var nextPara = nextPage.childrenEle[0];
                        if( nextPara != null && nextPara.className == 'oar-paragraph' ) {
                            nextLine = nextPara.childrenEle[0];
                        } else {
                            nextLine = null;
                        }
                    } else {
                        nextLine = null;
                    }
                } else {
                    nextLine = null;
                }
            }
        }


        if( nextLine ) {
            // find remedy from next line
            var rws = 0;
            for( var i = 0; i < nextLine.childrenEle.length; ++i ) {
                var cb = nextLine.childrenEle[i];
                if( rws + cb.offsetWidth > difW ) {

                    if( cb.className == 'oar-inline-eop' ) {
                        remedyBlock.push(cb);
                    } else if( cb.className = 'oar-inline-block' ) {
                        var text = cb.textContent;
                        var fs = cb.getBlockStyle();
                        var oj = -1;
                        for( var j = 0; j < text.length; ++j ) {
                            var textL = text.substring(0, j + 1);
                            var w = measureFontTextWH(textL, fs.fontFamily, fs.fontSize, fs.fontWeight).w;
                            if( rws + w > difW ) {
                                oj = j;
                                break;
                            }
                        }

                        if( oj > 0 ) {
                            var blockL = new InlineBlock();
                            blockL.setBlockStyle(cb.getBlockStyle());
                            blockL.textContent = text.substring(0, oj);
                            remedyBlock.push(blockL);

                            cb.textContent = text.substring(oj);

                            if( cb.overlay.si >= 0 ) {
                                if( oj <= cb.overlay.si ) {
                                    cb.overlay.si -= oj;
                                    cb.overlay.ei -= oj;
                                } else if( oj <= cb.overlay.ei ) {
                                    cb.overlay.si = 0;
                                    cb.overlay.ei -= oj;

                                    blockL.overlay.si = cb.overlay.si;
                                    blockL.overlay.ei = oj - 1;
                                } else {
                                    cb.overlay.si = -1;
                                    cb.overlay.ei = -1;

                                    blockL.overlay.si = cb.overlay.si;
                                    blockL.overlay.ei = cb.overlay.ei;
                                }
                            }


                        }
                    }

                    break;
                } else {
                    remedyBlock.push(cb);
                    rws += cb.offsetWidth;
                }
            }

            // remove and remedy
            if( remedyBlock.length > 0 ) {
                var lastBlock = this.childrenEle[this.childrenEle.length - 1];

                for( var i = 0; i < remedyBlock.length; ++i ) {
                    nextLine.removeBlock(remedyBlock[i]);

                    if( lastBlock && remedyBlock[i].className == 'oar-inline-block' && lastBlock.getBlockStyle().equals(remedyBlock[i].getBlockStyle()) ) {
                        if( i == 0 ) {
                            var ctd = new CursorTarget(lastBlock, null);
                            var ctdILH = new ILH(lastBlock.textContent.length, 0, lastBlock.offsetHeight);
                            var ctdStyle = lastBlock.getBlockStyle();
                            var stdL = measureFontTextWH(lastBlock.textContent, ctdStyle.fontFamily, ctdStyle.fontSize, ctdStyle.fontWeight).w;
                            ctdILH.l = stdL;
                            ctd.ilh = ctdILH;

                            cursorTargetDelta = ctd;
                        }

                        lastBlock.textContent += remedyBlock[i].textContent;
                        if( remedyBlock[i].overlay.si == 0 ) {
                            lastBlock.overlay.ei += remedyBlock[i].overlay.ei + 1;
                        }
                    } else {
                        this.appendBlock(remedyBlock[i]);

                        if( i == 0 ) {
                            var ctd = new CursorTarget(remedyBlock[i], null);
                            var ctdILH = new ILH(0, 0,remedyBlock[i].offsetHeight);
                            ctd.ilh = ctdILH;

                            cursorTargetDelta = ctd;
                        }
                    }
                }

                if( nextLine.childrenEle.length == 0 ) {
                    var nextPara = goog.dom.getParentElement(nextLine);
                    nextPara.removeLine(nextLine);
                    nextLine = null;

                    if( nextPara.childrenEle.length == 0 ) {
                        var cell = goog.dom.getParentElement(nextPara);
                        var pc = goog.dom.getParentElement(cell);
                        cell.removePTA(nextPara);

                        if( pc.className == 'oar-page-editorpane' ) {
                            var nextPage = goog.dom.getParentElement(pc);
                            if( nextPage.childrenEle.length == 0 ) {
                                G.doc.removePage(nextPage);
                            }
                        } else {
                            if( cell.childrenEle.length == 0 ) {
                                cell.appendPTA(new Paragraph());
                            }
                        }

                    }
                }


            } else {
                bThisLine = false;
            }
        } else {
            bThisLine = false;
        }


        maxWidth = this.getMaxWidth();
        childrenWidth = this.getChildrenWidth();
        difW = maxWidth - childrenWidth;

        nextLine = goog.dom.getNextElementSibling(this);
        lst = this.childrenEle[this.childrenEle.length - 1];
        remedyBlock = [];
    }

    this.refreshOverlayLayer();
    this.handleLineAlign();
    if( nextLine != null ){
        nextLine.refreshOverlayLayer();
        nextLine.handleWidthLack();
    }

    return cursorTargetDelta;
};

Line.handleLineAlign = function() {
    var para = goog.dom.getParentElement(this);
    var align = para.getParagraphStyle().align;

    if( align == 'right' ) {
        var maxW = this.getMaxWidth();
        var childrenW = this.getChildrenWidth();
        this.style.marginLeft = (maxW - childrenW) + 'px';
    } else if( align == 'center' ) {
        var maxW = this.getMaxWidth();
        var childrenW = this.getChildrenWidth();
        this.style.marginLeft = (maxW - childrenW) / 2 + 'px';
    } else {
        this.style.marginLeft = '0px';
    }
}

Line.handleOverflow = function() {
    var nextLine = this.getParagraphNextLine();
    var overflow = this.sliceOverflow();

    if( overflow.length > 0 ) {
        this.refreshOverlayLayer();
        this.handleLineAlign();

        if( nextLine && nextLine.className == 'oar-line' ) {

        } else {
            // if no next line
            var para = goog.dom.getParentElement(this);
            var newLine = new Line();
            para.appendLine(newLine);
            nextLine = newLine;
        }

        // shift block
        for(var i = 0; i < overflow.length; ++i) {
            nextLine.unshiftBlock(overflow[i]);
            nextLine.handleOverflow();
        }
    }
}

Line.sliceOverflow = function() {
    var over = [];

    // find the first over block
    var maxWidth = this.getMaxWidth();
    var cordBlock = null;
    var cordBlockI = -1;
    var ws = 0;
    for( var i = this.childrenEle.length - 1; i >= 0 ; --i ) {
        var child = this.childrenEle[i];
        if( child.className != 'oar-inline-eop' ) {
            var wl = child.offsetLeft - this.offsetLeft;
            ws = wl + child.offsetWidth;
            if( wl <= maxWidth && ws > maxWidth ) {
                cordBlock = child;
                cordBlockI = i;
                break;
            }
        }
    }

    // if line overflow
    if( cordBlock && cordBlock.className == 'oar-inline-block' ) {
        var overW = cordBlock.offsetWidth - (ws - maxWidth);
        var text = cordBlock.textContent;
        var cf = getComputedFontStyle(cordBlock);
        var fontFamily = cf.family;
        var fontSize = cf.size;
        var fontWeight = cf.weight;
        var cordI = 0;

        // find the over index
        for( var i = text.length - 1; i >= 0; --i ) {
            var w = measureFontTextWH(text.substring(0,i + 1), fontFamily, fontSize, fontWeight).w;
            if( w <= overW ) {
                cordI = i + 1;
                break;
            }
        }

        // break this block
        var textL = text.substring(0, cordI);
        var textR = text.substring(cordI);

        var blockR = new InlineBlock();
        blockR.textContent = textR;
        blockR.setBlockStyle(cordBlock.getBlockStyle());

        if( textL == '' ) {
            blockR.overlay.si = cordBlock.overlay.si;
            blockR.overlay.ei = cordBlock.overlay.ei;

            goog.dom.removeNode(cordBlock);
        } else {
            cordBlock.textContent = textL;

            if( cordBlock.overlay.ei >= cordI ) {
                blockR.overlay.si = 0;
                blockR.overlay.ei = cordBlock.overlay.ei - cordI;

                cordBlock.overlay.ei = cordI - 1
            }
        }

        // find and remove the overflow blocks
        for( var i = this.childrenEle.length - 1; i > cordBlockI ; --i ) {
            over.push(this.childrenEle[i]);
            this.removeBlock(this.childrenEle[i]);
        }
        over.push(blockR);
    } else if( cordBlock && cordBlock.className == 'oar-inline-image' ) {
        for( var i = this.childrenEle.length - 1; i >= cordBlockI ; --i ) {
            over.push(this.childrenEle[i]);
            this.removeBlock(this.childrenEle[i]);
        }
    }

    return over;
}

Line.getInlineFromPosition = function(x, y) {
    var child;
    for( var i = 0; i < this.childrenEle.length; ++i) {
        child = this.childrenEle[i];
        if( child.className == 'oar-inline-block' || child.className == 'oar-inline-image' ) {
            var lp = getContainerOffset(child);
            var top = lp.top;
            var left = lp.left;

            if( /*top <= y && child.offsetHeight + top > y &&  */
                left <= x && child.offsetWidth + left > x) {
                return child;
            }
        }
    }

    return child;
}

Line.insertBlockAfter = function(n, after) {
    var ai = 0;
    for( var i in this.childrenEle ) {
        if( this.childrenEle[i] == after ) {
            ai = parseInt(i);
            break;
        }
    }
    goog.dom.insertSiblingAfter(n, after);
    this.childrenEle.splice(ai + 1, 0, n);
}

Line.insertBlockBefore = function(n, before) {
    var ai = 0;
    for( var i in this.childrenEle ) {
        if( this.childrenEle[i] == before ) {
            ai = i;
            break;
        }
    }

    goog.dom.insertSiblingBefore(n, before);
    this.childrenEle.splice(ai, 0, n);
};

Line.unshiftBlock = function(block) {
    var first = this.childrenEle[0];
    if( first ) {
        if( block.className == 'oar-inline-block' && first.className == 'oar-inline-block' && block.getBlockStyle().equals(first.getBlockStyle()) ) {
            // same style
            first.textContent = block.textContent + first.textContent;
        } else {
            goog.dom.insertSiblingBefore(block, first);
            this.childrenEle.unshift(block);
        }

    } else {
        goog.dom.appendChild(this.content, block);
        this.childrenEle.unshift(block);
    }
}

Line.removeBlock = function(block) {
    var bi = -1;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( block == this.childrenEle[i] ) {
            bi = i;
            break;
        }
    }
    if( bi != -1 ) {
        goog.dom.removeNode(block);
        this.childrenEle.splice(bi, 1);
    }
}

Line.appendBlock = function(block) {
    var lastBlock = this.childrenEle[this.childrenEle.length-1];
    if( lastBlock ) {
        goog.dom.insertSiblingAfter(block, lastBlock);
    } else {
        goog.dom.appendChild(this.content, block);
    }

    this.childrenEle.push(block);
}

//---------------------------------------------------------------------------------------------------------------------- table
// table resizer
var TableResizer = function(target) {
    this.target = target;
    this.targetRow = 0;
    this.targetCol = 0;

    var targetTL = getContainerOffset(target);

    var hBar = goog.dom.createDom('div');
    hBar.className = 'oar-table-resizer-h';
    hBar.style.width = target.offsetWidth + 'px';
    hBar.style.height = '7px';
    //hBar.style.backgroundColor = '#f00';
    hBar.style.position = 'absolute';
    hBar.style.left = targetTL.left + 'px';
    hBar.style.top = targetTL.top + 'px';
    hBar.style.cursor = 'n-resize';
    hBar.style.opacity = 0;
    var hBarGuide = goog.dom.createDom('div');
    hBarGuide.style.height = '2px';
    hBarGuide.style.width = '100%';
    hBarGuide.style.marginTop = '2px';
    hBarGuide.style.backgroundColor = '#68e';
    //hBarGuide.style.opacity = 0.8;
    hBar.appendChild(hBarGuide);

    var vBar = goog.dom.createDom('div');
    vBar.className = 'oar-table-resizer-v';
    vBar.style.height = target.offsetHeight + 'px';
    vBar.style.width = '7px';
    //vBar.style.backgroundColor = '#f00';
    vBar.style.position = 'absolute';
    vBar.style.left = targetTL.left + 'px';
    vBar.style.top = targetTL.top + 'px';
    vBar.style.cursor = 'e-resize';
    vBar.style.opacity = 0;
    var vBarGuide = goog.dom.createDom('div');
    vBarGuide.style.width = '2px';
    vBarGuide.style.height = '100%';
    vBarGuide.style.marginLeft = '2px';
    vBarGuide.style.backgroundColor = '#68e';
    //vBarGuide.style.opacity = 0.8;
    vBar.appendChild(vBarGuide);

    this.hBar = hBar;
    this.vBar = vBar;

    G.doc.appendChild(hBar);
    G.doc.appendChild(vBar);

    this.work = false;

    goog.events.listen(hBar, goog.events.EventType.MOUSEDOWN, function(e) {
        var d = new goog.fx.Dragger(hBar);
        G.tableResizer.work = true;
        var difH = hBar.offsetTop;
        d.addEventListener(goog.fx.Dragger.EventType.DRAG, function(e) {
            var targetTL = getContainerOffset(G.tableResizer.target);
            hBar.style.opacity = 1;
            hBar.style.left = targetTL.left + 'px';
        });
        d.addEventListener(goog.fx.Dragger.EventType.END, function(e) {
            hBar.style.opacity = 0;
            G.tableResizer.work = false;
            difH = hBar.offsetTop - difH;

            var tr = G.tableResizer.target.rows[G.tableResizer.targetRow];
            tr.style.height = tr.offsetHeight + difH + 'px';

            d.dispose();
        });
        d.startDrag(e);
    });

    goog.events.listen(vBar, goog.events.EventType.MOUSEDOWN, function(e) {
        var d = new goog.fx.Dragger(vBar);
        G.tableResizer.work = true;
        var orgTop = getContainerOffset(hBar).top;
        var orgLeft = getContainerOffset(vBar).left;

        var difW = vBar.offsetLeft;
        d.addEventListener(goog.fx.Dragger.EventType.DRAG, function(e) {
            var targetTL = getContainerOffset(G.tableResizer.target);
            vBar.style.opacity = 1;
            vBar.style.top = targetTL.top + 'px';
        });
        d.addEventListener(goog.fx.Dragger.EventType.END, function(e) {
            vBar.style.opacity = 0;
            G.tableResizer.work = false;
            difW = vBar.offsetLeft - difW;

            var tdArr = [];
            for( var r = 0; r < G.tableResizer.target.rows.length; ++r ) {
                for( var c = 0; c < G.tableResizer.target.rows[r].cells.length; ++c ){
                    var td = G.tableResizer.target.rows[r].cells[c];
                    var tdLT = getContainerOffset(td);
                    if( orgLeft > tdLT.left && orgLeft < tdLT.left + td.offsetWidth ) {
                        tdArr.push(td);
                    }
                }
            }

            for( var i = 0; i < tdArr.length; ++i ) {
                tdArr[i].style.maxWidth = tdArr[i].offsetWidth + difW + 'px';
                tdArr[i].style.width = tdArr[i].offsetWidth + difW + 'px';

                // handle lien overflow or leak
                var tdArrCell = tdArr[i].getElementsByClassName('oar-pta-cell')[0];
                if( tdArrCell ) {
                    var tdArrPara = tdArrCell.getElementsByClassName('oar-paragraph')[0];
                    if( tdArrPara ) {
                        var tdArrLine = tdArrPara.childrenEle[0];
                        if( tdArrLine ) {

                            if( difW <= 0 ) {
                                tdArrLine.handleOverflow();
                            } else {
                                tdArrLine.handleWidthLack();
                            }
                        }
                    }
                }
            }

            d.dispose();

            G.cursor.refreshTarget();

            var lineC = goog.dom.getParentElement(G.cursor.target.inline);
            var line = goog.dom.getParentElement(lineC);
            var para = goog.dom.getParentElement(line);
            var cell = goog.dom.getParentElement(para);
            var topPage = cell.getTopPage();
            //line.handleOverflow();
            //line.handleWidthLack();
            topPage.handleOverflow();
            topPage.handleWidthLack();
        });
        d.startDrag(e);
    });
}

TableResizer.prototype.setTarget = function(target) {
    this.target = target;
    var targetTL = getContainerOffset(target);

    this.hBar.style.width = target.offsetWidth + 'px';
    this.hBar.style.left = targetTL.left + 'px';
    this.hBar.style.top = targetTL.top + 'px';

    this.vBar.className = 'oar-table-resizer-v';
    this.vBar.style.height = target.offsetHeight + 'px';
    this.vBar.style.left = targetTL.left + 'px';
    this.vBar.style.top = targetTL.top + 'px';
};

TableResizer.prototype.move = function(x, y) {
    var targetTL = getContainerOffset(this.target);
    var xtt = x - targetTL.left;
    var ytt = y - targetTL.top;
    var xc = 0;
    var yc = 0;

    var hs = 0;
    var ri = -1;
    var row = null;
    var rowH = 0;
    for( var i = 0; i < this.target.rows.length; ++i ) {
        row = this.target.rows[i];
        rowH = row.offsetHeight;
        if( hs < ytt && ytt <= hs + rowH ) {
            ri = i;
            if( row.getElementsByTagName('td').length == 0 ){
                ri = 0;
                for( var j = i - 1; j >=0 ; ++j ) {
                    if( this.target.rows[j].getElementsByTagName('td').length > 0 ) {
                        ri = j;
                        row = this.target.rows[j];
                        break;
                    }
                }
            }
            break;
        }

        hs += rowH;
    }

    if( ri != -1 ) {
        if( ri == 0 ) {
            yc = targetTL.top + rowH;
        } else {
            if( (ytt - hs) > (hs + rowH - ytt) ) {
                yc = hs + rowH;
            } else {
                yc = hs;
                ri--;
            }
            yc += targetTL.top;
        }

        var ci = -1;
        var ws = 0;
        var colW = 0;
        var tds = row.getElementsByTagName('td');
        for( var j = 0; j < tds.length; ++j ) {
            var col = tds[j];
            colW = col.offsetWidth;
            var colLeft = getContainerOffset(col).left - targetTL.left;
            if( colLeft < xtt && xtt <= colLeft + colW ) {
                ci = j;
                ws = colLeft;
                break;
            } else if( xtt > ws && xtt <= colLeft  ) {
                ci = j;
                colW = colLeft - ws;
                break;
            }

            ws = colLeft + colW;
        }

        if( ci != -1 ) {
            if( ci == 0 ) {
                xc = targetTL.left + ws + colW;
            } else {
                if( (xtt - ws) > (ws + colW - xtt) ) {
                    xc = ws + colW;
                } else {
                    xc  = ws;
                    ci--;
                }
                xc += targetTL.left;
            }
        }
    }

    this.targetRow = ri;
    this.targetCol = ci;

    this.hBar.style.top = yc - 1 + 'px';
    this.vBar.style.left = xc - 1 + 'px';
}

// table of paragraph type
var Table = function(cols, rows) {
    var ele = goog.editor.Table.createDomTable(document, cols, rows);
    ele.className = 'oar-table';
    ele.style.border = '1px solid #000';
    asse(ele, Table);

    for( var i in ele.rows ) {
        if( ele.rows[i] instanceof HTMLElement ){
            var cells = ele.rows[i].getElementsByTagName('td');
            for( var c in cells ) {
                if( cells[c] instanceof HTMLElement ) {
                    cells[c].style.verticalAlign = 'top';
                    cells[c].textContent = '';
                    cells[c].style.padding = '4px';
                    goog.dom.appendChild(cells[c], new PTACell());
                }
            }
        }
    }

    var gTable = new goog.editor.Table(ele);
    ele.handler = gTable;
    ele.resizer = null;

    goog.events.listen(ele, goog.events.EventType.MOUSEMOVE, ele.onMouseMove, true);

    return ele;
};

Table.adjustCellWidth = function() {
    var pt = goog.dom.getParentElement(this);
    if( pt ) {
        var ptw = pt.offsetWidth;

        for( var i in this.rows ) {
            var cells = this.rows[i].cells;
            for( var c in cells ) {
                if( cells[c] instanceof HTMLElement ) {
                    cells[c].style.verticalAlign = 'top';
                    cells[c].textContent = '';
                    cells[c].style.width = ptw / cells.length + 'px';
                    cells[c].style.maxWidth = ptw / cells.length + 'px';
                    goog.dom.appendChild(cells[c], new PTACell());
                }
            }
        }
    }

}

Table.onMouseMove = function(e) {
    if(G.tableResizer && G.tableResizer.work ) {
        return;
    }

    var x = e.clientX - G.container.offsetLeft + G.container.scrollLeft;
    var y = e.clientY - G.container.offsetTop + G.container.scrollTop;

    if(G.tableResizer ) {
        G.tableResizer.setTarget(this);
    } else {
        var tableResizer = new TableResizer(this);
        this.resizer = tableResizer;
        G.tableResizer = tableResizer
    }

    G.tableResizer.move(x, y);
}

Table.getCellRC = function(cell) {
    var rc = null;
    for( var i = 0; i < this.rows.length; ++i ) {
        if( this.rows[i] instanceof HTMLElement ){
            var tds = this.rows[i].getElementsByTagName('td');
            for( var j = 0; j < tds.length; ++j ) {
                if( tds[j] instanceof HTMLElement ) {
                    var c = goog.dom.getChildren(tds[j])[0];
                    if(c == cell){
                       rc = {row:i, col:j};
                    }
                }
            }
        }
    }

    return rc;
};

Table.insertCol = function(col) {
    var nCol = this.handler.insertColumn(col);
    for( var td in nCol ) {
        if( nCol[td] instanceof HTMLElement ) {
            nCol[td].textContent = '';
            nCol[td].style.verticalAlign = 'top';
            nCol[td].style.padding = '4px';
            goog.dom.appendChild(nCol[td], new PTACell());
        }
    }

    G.cursor.refreshTarget();
};

Table.mergeCells = function(startRow, startCol, endRow, endCol){
    this.handler.mergeCells(startRow, startCol, endRow, endCol);
}

Table.splitCell = function(row, col) {
    var cells = this.handler.splitCell(row, col);

    for( var td in cells ) {
        if( cells[td] instanceof HTMLElement ) {
            var children = goog.dom.getChildren(cells[td]);
            if( children.length == 0 ) {
                cells[td].textContent = '';
                goog.dom.appendChild(cells[td], new PTACell());
            }
        }
    }
}

Table.removeCol = function(col) {
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    this.handler.removeColumn(col);

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
}

Table.insertRow = function(row) {
    var nRow = this.handler.insertRow(row);
    var tds = nRow.getElementsByTagName('td');
    for( var td in tds ) {
        if( tds[td] instanceof HTMLElement ) {
            tds[td].textContent = '';
            tds[td].style.verticalAlign = 'top';
            tds[td].style.padding = '4px';
            goog.dom.appendChild(tds[td], new PTACell());
        }
    }

    G.cursor.refreshTarget();
};

Table.removeRow = function(row) {
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    this.handler.removeRow(row);

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);
};

Table.insertCell = function(cell, row, col) {
    this.handler.insertCellElement(cell, row, col);
};

Table.getCellFromPosition = function(x ,y) {
    var cell;
    for( var i in this.rows ) {
        if( this.rows[i] instanceof HTMLElement ){
            var cells = this.rows[i].getElementsByTagName('td');
            for( var c in cells ) {
                if( cells[c] instanceof HTMLElement ) {
                    cell = cells[c].getElementsByClassName('oar-pta-cell')[0];
                    var so = getContainerOffset(cells[c]);

                    var left = so.left;
                    var top = so.top;
                    var right = left + cells[c].offsetWidth;
                    var bottom = top + cells[c].offsetHeight;

                    if( x > left && x < right && y > top && y < bottom ) {
                        return cell;
                    }
                }
            }
        }
    }
    return cell;
}

//---------------------------------------------------------------------------------------------------------------------- table cell
var PTACell = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-pta-cell';

    asse(ele, PTACell);
    ele.childrenEle = [];

    var p = new Paragraph();
    ele.appendPTA(p);

    return ele;
};

PTACell.hasTopOverlay = function() {
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( this.childrenEle[i].className == 'oar-paragraph' ) {
            if( this.childrenEle[i].hasOverlay() ) {
                return true;
            }
        }
    }

    return false;
}

PTACell.removePTA = function(pta) {
    var pi = -1;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( this.childrenEle[i] == pta ) {
            pi = i;
            break;
        }
    }

    if( pi != -1 ) {
        goog.dom.removeNode(pta);
        this.childrenEle.splice(pi, 1);
    }
}

PTACell.insertPTAAt = function(n, target, i) {
    // TODO: error fix, has one more EOP added
    var lineC = goog.dom.getParentElement(target);
    var line = goog.dom.getParentElement(lineC);
    var para = goog.dom.getParentElement(line);

    if( i == 0 ) {
        this.insertPTABefore(n, para);
    } else {
        var textL = target.textContent.substring(0, i);
        var textR = target.textContent.substring(i);

        var blockR = new InlineBlock();
        blockR.setBlockStyle(target.getBlockStyle());
        blockR.textContent = textR;

        target.textContent = textL;
        var blockLEOP = new InlineEOP();
        line.insertBlockAfter(blockLEOP, target);

        // stat all blocks left in line
        var blocksLeft = [];
        blocksLeft.push(blockR);

        var bt = false;
        for( var i = 0; i < line.childrenEle; ++i ) {
            var cb = line.childrenEle[i];
            if( bt ) {
                blocksLeft.push(cb);
                line.removeBlock(bt);
            }
            if( cb == target ) {
                bt = true;
            }
        }
        var fLine = new Line();
        for( var i = 0; i < blocksLeft.length; ++i ) {
            fLine.appendBlock(blocksLeft[i]);
        }

        // stat all lines left
        var linesLeft = [];
        linesLeft.push(fLine);

        var bl = false;
        for( var i = 0; i < para.childrenEle; ++i ) {
            var cl = para.childrenEle[i];
            if( bl ) {
                linesLeft.push(cl);
                para.removeLine(cl);
            }

            if( cl == line ) {
                bl = true;
            }
        }

        // new paragraph
        var paraR = new Paragraph();
        paraR.removeLineAt(0);
        for( var i = 0; i < linesLeft.length; ++i ) {
            paraR.appendLine(linesLeft[i]);
        }

        // add new paragraph
        this.insertPTAAfter(paraR, para);

        paraR.childrenEle[0].handleWidthLack();

        // insert n
        this.insertPTAAfter(n, para);
    }
};

PTACell.insertPTAAfter = function(n, after) {
    var ai = 0;
    for( var i in this.childrenEle ) {
        if( this.childrenEle[i] == after ) {
            ai = parseInt(i);
            break;
        }
    }
    goog.dom.insertSiblingAfter(n, after);
    this.childrenEle.splice(ai + 1, 0, n);
};

PTACell.insertPTABefore = function(n, before) {
    var ai = -1;
    for( var i in this.childrenEle ) {
        if( this.childrenEle[i] == before ) {
            ai = parseInt(i);
            break;
        }
    }

    if( ai != -1  ) {
        goog.dom.insertSiblingBefore(n, before);
        this.childrenEle.splice(ai, 0, n);
    }
}

PTACell.getPTAFromPosition = function(x, y) {
    var child;
    for( var i = 0; i < this.childrenEle.length; ++i) {
        child = this.childrenEle[i];
        if( child.className == 'oar-paragraph' || child.className == 'oar-table' ) {
            var tl = getContainerOffset(child);
            var top = tl.top;
            var left = tl.left;
            if( top < y && child.offsetHeight + top > y &&
                left < x && child.offsetWidth + left > x) {
                return child;
            }
        }
    }

    return child;
}

PTACell.appendPTA = function(pt) {
    var last = this.childrenEle[this.childrenEle.length-1];
    if( last ) {
        goog.dom.insertSiblingAfter(pt, last);
    } else {
        goog.dom.appendChild(this, pt);
    }

    this.childrenEle.push(pt);
};

PTACell.getTopPage = function() {
    var pCell = goog.dom.getParentElement(this);
    var page = null;

    if( pCell.className == 'oar-page-editorpane' ) {
        page = goog.dom.getParentElement(pCell);
    } else {
        var td = pCell;
        var table = goog.dom.getParentElement(td);
        while( table != null ) {
            if( table.className == 'oar-table' ) {
                break;
            } else {
                table = goog.dom.getParentElement(table);
            }
        }

        if( table != null ) {
            var cell2 = goog.dom.getParentElement(table);
            if( cell2.className == 'oar-pta-cell' ) {
                page = cell2.getTopPage();
            }
        }
    }

    return page;
}

//---------------------------------------------------------------------------------------------------------------------- around box
var ABox = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-abox';
    ele.style.width = '50px';
    ele.style.height = '50px';
    ele.style.position = 'absolute';
    ele.style.backgroundColor = '#99ccff';
    ele.style.opacity = 0.2;
    asse(ele, ABox);
    ele.childrenEle = [];

    var cell = new PTACell();
    goog.dom.appendChild(ele, cell);
    ele.cell = cell;

    goog.events.listen(ele, goog.events.EventType.MOUSEDOWN, function(e) {
        var d = new goog.fx.Dragger(ele);
        d.addEventListener(goog.fx.Dragger.EventType.DRAG, function(e) {
            G.cursor.style.visibility = 'hidden';
        });
        d.addEventListener(goog.fx.Dragger.EventType.END, function(e) {
            G.cursor.style.visibility = 'visible';
            d.dispose();
        });
        d.startDrag(e);
    });

    return ele;
}

//---------------------------------------------------------------------------------------------------------------------- paragraph
var ParagraphStyle = function() {
    this.presetStyle = 'normal'; // heading1, heading2, heading3

    this.align = 'left'; //left, center, right
    this.leftIndent = 0;
    this.rightIndent = 0;
    this.topSpacing = 0;
    this.bottomSpacing = 0;
}

var Paragraph = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-paragraph';
    asse(ele, Paragraph);
    ele.childrenEle = [];
    ele.paragraphStyle = null;

    var pStyle = new ParagraphStyle();
    pStyle.align = G.toolbar.getParagraphAlign();
    ele.setParagraphStyle(pStyle);

    var line = new Line();
    var eop = new InlineEOP();
    line.appendBlock(eop);
    ele.appendLine(line);

    return ele;
};

Paragraph.hasOverlay = function() {
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( this.childrenEle[i].hasOverlay() ) {
            return true;
        }
    }

    return false;
}

Paragraph.setParagraphStyle = function(style) {
    this.paragraphStyle = style;

    this.style.marginLeft = style.leftIndent + 'px';
    this.style.marginRight = style.rightIndent + 'px';
    this.style.marginTop = style.topSpacing + 'px';
    this.style.marginBottom = style.bottomSpacing;

}

Paragraph.getParagraphStyle = function() {
    return this.paragraphStyle;
}

Paragraph.handleLineAlign = function() {
    for( var i = 0; i < this.childrenEle.length; ++i ){
        var cl = this.childrenEle[i];
        if( cl.className == 'oar-line' ) {
            cl.handleLineAlign();
        }
    }
};

Paragraph.getLineFromPosition = function(x, y) {
    var child;
    for( var i = 0; i < this.childrenEle.length; ++i) {
        child = this.childrenEle[i];
        if( child.className == 'oar-line' ) {
            var tl = getContainerOffset(child);
            var top = tl.top;
            var left = tl.left;
            if( top < y && child.offsetHeight + top > y &&
                left < x && child.offsetWidth + left > x) {
                return child;
            }
        }
    }

    return child;
}

Paragraph.mergeFront = function(para) {
    for( var i = para.childrenEle.length - 1; i >= 0; --i ) {
        this.unshiftLine(para.childrenEle[i]);
    }

    this.childrenEle[0].handleWidthLack();
}

Paragraph.unshiftLine = function(line) {
    var first = this.childrenEle[0];
    if( first ) {
        goog.dom.insertSiblingBefore(line, first);
        this.childrenEle.unshift(line);
    }
}

Paragraph.appendLine = function(line) {
    var lastLine = this.childrenEle[this.childrenEle.length-1];
    if( lastLine ) {
        goog.dom.insertSiblingAfter(line, lastLine);
    } else {
        goog.dom.appendChild(this, line);
    }

    this.childrenEle.push(line);
}

Paragraph.removeLine = function(line) {
    var li = -1;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( this.childrenEle[i] == line ) {
            li = i;
            break;
        }
    }

    if( li != -1 ) {
        goog.dom.removeNode(line);
        this.childrenEle.splice(li, 1);
    }
}

Paragraph.removeLineAt = function(i) {
    var line = this.childrenEle[i];
    if( line ) {
        goog.dom.removeNode(line);
        this.childrenEle.splice(i, 1);
    }
}

Paragraph.hasEOPEnd = function() {
    var lastLine = this.childrenEle[this.childrenEle.length - 1];
    var lastBlock = null;
    if( lastLine ) {
        lastBlock = lastLine.childrenEle[lastLine.childrenEle.length - 1];
    }
    if( lastBlock ) {
        if( lastBlock.className == 'oar-inline-eop' ) {
            return true;
        }
    }

    return false;
}

//---------------------------------------------------------------------------------------------------------------------- page
var Header = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-page-header';
    //ele.style.borderBottom = '1px dotted #DDD';
    ele.style.height = '85px';
    ele.style.width = 'auto';
    ele.style.padding = '10px 100px 5px 100px';

    ele.childrenEle = [];

    return ele;
}

var Footer = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-page-footer';
    //ele.style.borderTop = '1px dotted #DDD';
    ele.style.height = '85px';
    ele.style.padding = '10px 100px 5px 100px';

    ele.childrenEle = [];

    return ele;
}

var EditorPane = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-page-editorpane';
    ele.style.paddingLeft = '100px';
    ele.style.paddingRight = '100px';
    //ele.style.paddingTop = '20px';
    //ele.style.paddingBottom = '20px';
    ele.style.height = (Page.fixedHeight - 100 * 2) + 'px';
    ele.childrenEle = [];

    var cell = new PTACell();
    ele.cell = cell;
    goog.dom.appendChild(ele, cell);

    return ele;
}

var Page = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-page';
    ele.style.width = Page.fixedWidth + 'px';
    //ele.style.height = Page.fixedHeight + 'px';
    ele.style.position = 'absolute';
    ele.style.backgroundColor = '#FFF';
    ele.style.marginLeft = (G.doc.offsetWidth - Page.fixedWidth ) / 2 + 'px';
    ele.style.marginTop = '5px';
    ele.style.marginBottom = '5px';
    ele.style.border = '1px solid #CCC';
    ele.style.boxShadow = '0px 0px 3px 1px #ccc';

    // four corner
    var ltc = goog.dom.createDom('div');
    ltc.className = 'oar-page-corner-lefttop';
    ltc.style.width = '30px';
    ltc.style.height = '30px';
    ltc.style.borderRight = '1px solid #CCC';
    ltc.style.borderBottom = '1px solid #CCC';
    ltc.style.position = 'absolute';
    ltc.style.left = '70px';
    ltc.style.top = '70px';
    goog.dom.appendChild(ele, ltc);

    var rtc = goog.dom.createDom('div');
    rtc.className = 'oar-page-corner-lefttop';
    rtc.style.width = '30px';
    rtc.style.height = '30px';
    rtc.style.borderLeft = '1px solid #CCC';
    rtc.style.borderBottom = '1px solid #CCC';
    rtc.style.position = 'absolute';
    rtc.style.left = Page.fixedWidth - 100 + 'px';
    rtc.style.top = '70px';
    goog.dom.appendChild(ele, rtc);

    var lbc = goog.dom.createDom('div');
    lbc.className = 'oar-page-corner-lefttop';
    lbc.style.width = '30px';
    lbc.style.height = '30px';
    lbc.style.borderRight = '1px solid #CCC';
    lbc.style.borderTop = '1px solid #CCC';
    lbc.style.position = 'absolute';
    lbc.style.left = '70px';
    lbc.style.top = Page.fixedHeight - 100 + 'px';
    goog.dom.appendChild(ele, lbc);

    var rbc = goog.dom.createDom('div');
    rbc.className = 'oar-page-corner-lefttop';
    rbc.style.width = '30px';
    rbc.style.height = '30px';
    rbc.style.borderLeft = '1px solid #CCC';
    rbc.style.borderTop = '1px solid #CCC';
    rbc.style.position = 'absolute';
    rbc.style.left = Page.fixedWidth - 100 + 'px';
    rbc.style.top = Page.fixedHeight - 100 + 'px';
    goog.dom.appendChild(ele, rbc);

    asse(ele, Page);

    ele.headerEle = new Header();
    ele.footerEle = new Footer();
    ele.editorPane = new EditorPane();
    ele.cell = ele.editorPane.cell;
    ele.childrenEle = ele.cell.childrenEle;

    goog.dom.appendChild(ele, ele.headerEle);
    goog.dom.appendChild(ele, ele.editorPane);
    goog.dom.appendChild(ele, ele.footerEle);

    return ele;
};
//A4 = 210 : 297
Page.fixedWidth = 800;
Page.fixedHeight = 1150;//Page.fixedWidth / 210 * 297;

Page.getChildrenHeight = function() {
    var hs = 0;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        hs += this.childrenEle[i].offsetHeight;
    }

    return hs;
}

Page.handleWidthLack = function() {
    var maxHeight = this.editorPane.offsetHeight;
    var childrenHeight = this.getChildrenHeight();
    var difH = maxHeight - childrenHeight;

    var nextPage = goog.dom.getNextElementSibling(this);
    while( nextPage ) {
        if( nextPage && nextPage.className == 'oar-page' ) {
            break;
        } else {
            nextPage = goog.dom.getNextElementSibling(nextPage);
        }
    }

    if( nextPage && nextPage.className == 'oar-page' ) {
        var nextPTs = [];

        var hs = 0;
        for( var i = 0; i < nextPage.childrenEle.length; ++i ) {
            var npt = nextPage.childrenEle[i];

            if( hs + npt.offsetHeight > difH ) {
                if( npt.className == 'oar-paragraph' ) {
                    // slice paragraph
                    var needLines = [];

                    for( var li = 0; li < npt.childrenEle.length; ++li ) {
                        var pLine = npt.childrenEle[li] ;
                        if( hs + pLine.offsetHeight <= difH ) {
                            needLines.push(pLine);
                            hs += pLine.offsetHeight;
                        } else {
                            break;
                        }
                    }

                    if( needLines.length > 0 ) {
                        var nlPara = new Paragraph();
                        nlPara.removeLineAt(0);
                        for( var li = 0; li < needLines.childrenEle.length; ++li ) {
                            npt.removeLine(needLines[li]);
                            nlPara.appendLine(needLines[li]);
                        }

                        nextPTs.push(nlPara);
                    }

                } else if( npt.className == 'oar-table' ) {
                    // slice table
                    var overTRs = [];
                    var overTRI = -1;

                    for( var ri = 0; ri < npt.rows.length; ++ri ) {
                        var tr = npt.rows[ri];
                        if( hs + tr.offsetHeight <= difH ) {
                            hs += tr.offsetHeight;
                        } else {
                            overTRI = ri;
                            break;
                        }
                    }

                    if( overTRI == 0 ) {

                    } else if( overTRI == -1 ) {
                        nextPTs.push(npt);
                        nextPage.removePTA(npt);

                    } else if( overTRI > 0 ) {
                        for( var ri = overTRI; ri < npt.rows.length; ++ri ) {
                            var tr = npt.rows[ri];
                            overTRs.push(tr);
                        }

                        for( var ri = 0; ri < overTRs.length; ++ri ) {
                            goog.dom.removeNode(overTRs[ri]);
                        }

                        // handle rowspan
                        for( var ri = overTRI - 1; ri >= 0; --ri ) {
                            var tr = npt.rows[ri];

                            for( var j = 0; j < tr.cells.length; ++j ) {
                                var td = tr.cells[j];
                                var rowspan = 1;
                                if( td.rowSpan != null ) {
                                    rowspan = parseInt(td.rowSpan);
                                }

                                if( rowspan > 1 ) {
                                    var ttri = ri + (rowspan - 1);
                                    if( ttri >= overTRI ) {
                                        td.rowSpan = overTRI - ri;
                                        td.style.width = td.offsetWidth + 'px';

                                        // add new td to over tr
                                        var ntd = goog.dom.createDom('td');
                                        ntd.rowSpan = rowspan - (overTRI - ri);
                                        ntd.colSpan = td.colSpan;
                                        ntd.style.width = td.offsetWidth + 'px';
                                        ntd.style.verticalAlign = 'top';
                                        ntd.MERGEUP = true;

                                        ntd.appendChild(new PTACell());

                                        var fOverTR = overTRs[0];
                                        goog.dom.insertSiblingBefore(ntd, fOverTR.cells[j])
                                    }
                                }
                            }
                        }

                        // create overflow table
                        var nTable = new Table(1,1);
                        nTable.removeRow(0);

                        var nTableC = nTable;
                        if( nTable.getElementsByTagName('tbody')[0] ) {
                            nTableC =  nTable.getElementsByTagName('tbody')[0];
                        }

                        for( var ri = 0; ri < overTRs.length; ++ri ) {
                            nTableC.appendChild(overTRs[ri]);
                        }

                        nextPage.insertPTAAfter(nTable, npt);
                        nextPage.removePTA(npt);
                        nextPTs.push(npt);
                    }
                }

                break;
            } else {
                nextPTs.push(npt);
                hs += npt.offsetHeight;
            }
        }

        if( nextPTs.length > 0 ) {
            for( var i = 0; i < nextPTs.length; ++i ) {
                nextPage.removePTA(nextPTs[i]);

                if( nextPTs[i].className == 'oar-paragraph' ) {
                    this.appendPTA(nextPTs[i]);
                } else if(  nextPTs[i].className == 'oar-table' ) {
                    var aTable = nextPTs[i];
                    var fTable = this.childrenEle[this.childrenEle.length - 1];

                    if( fTable.className == 'oar-table' ) {
                        // merge table
                        var fTableRs = fTable.rows.length;
                        for( var pti = 0; pti < aTable.rows.length; ++pti ) {
                            goog.dom.insertSiblingAfter(aTable.rows[pti], fTable.rows[fTable.rows.length - 1]);
                        }

                        // handle rowspan
                        for( var ri = fTableRs - 1; ri >= 0 ; --ri  ) {
                            for( var i = 0; i < fTable.rows[ri].cells.length; ++i ) {
                                if( fTable.rows[ri+1].cells[i] && fTable.rows[ri+1].cells[i].MERGEUP == true ) {
                                    var nRowSpan = parseInt(fTable.rows[ri].cells[i].rowSpan) + parseInt(fTable.rows[ri+1].cells[i].rowSpan);

                                    goog.dom.removeNode(fTable.rows[ri+1].cells[i]);
                                    fTable.rows[ri].cells[i].rowSpan = nRowSpan;

                                    if( fTable.rows[ri].cells[i].MERGEUP == true ) {
                                        fTable.rows[ri].cells[i].MERGEUP = true;
                                    } else {
                                        delete  fTable.rows[ri].cells[i].MERGEUP;
                                    }
                                }
                            }
                        }
                    } else {
                        this.appendPTA(nextPTs[i]);
                    }
                }
            }

            // delete if no child
            if( nextPage.childrenEle.length == 0 ) {
                G.doc.removePage(nextPage);
            }

            nextPage.handleWidthLack();
        }
    }
};

Page.getPTAFromPosition = function(x, y) {
    var child;
    for( var i = 0; i < this.childrenEle.length; ++i) {
        child = this.childrenEle[i];
        if( child.className == 'oar-paragraph' || child.className == 'oar-table' || child.className == 'oar-abox' ) {
            var lp = getContainerOffset(child);
            var top = lp.top;
            var left = lp.left;
            if( top < y && child.offsetHeight + top > y &&
                left < x && child.offsetWidth + left > x) {
                return child;
            }
        }
    }

    return child;
}

Page.unshiftPTA = function(pta) {
    var first = this.childrenEle[0];
    if( first ) {
        goog.dom.insertSiblingBefore(pta, first);
        this.childrenEle.unshift(pta);
    } else {
        goog.dom.appendChild(this.cell, pta);
        this.childrenEle.unshift(pta);
    }
}

Page.insertPTAAfter = function(n, after) {
    var ai = 0;
    for( var i in this.childrenEle ) {
        if( this.childrenEle[i] == after ) {
            ai = parseInt(i);
            break;
        }
    }
    goog.dom.insertSiblingAfter(n, after);
    this.childrenEle.splice(ai + 1, 0, n);
}

Page.appendPTA = function(pt) {
    var last = this.childrenEle[this.childrenEle.length-1];
    if( last ) {
        goog.dom.insertSiblingAfter(pt, last);
    } else {
        goog.dom.appendChild(this.cell, pt);
    }

    this.childrenEle.push(pt);
}

Page.appendTable = function(table) {
    var last = this.childrenEle[this.childrenEle.length-1];
    if( last ) {
        goog.dom.insertSiblingAfter(table, last);
    } else {
        goog.dom.appendChild(this.cell, table);
    }

    this.childrenEle.push(table);
}

Page.removePTA = function(pta) {
    var pi = -1;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( this.childrenEle[i] == pta ) {
            pi = i;
            break;
        }
    }

    if( pi != -1 ) {
        goog.dom.removeNode(pta);
        this.childrenEle.splice(pi, 1);
    }
}

Page.getFirstParagraph = function() {
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( this.childrenEle[i].className = 'oar-paragraph' ) {
            return this.childrenEle[i];
        }
    }

    return null;
}

Page.sliceOverflow = function() {
    // avoid table overflow
    var overParas = [];
    var pageH = parseInt(this.editorPane.style.height);

    var oPara = null;
    for( var i = this.childrenEle.length - 1; i >= 0; --i  ) {
        var p = this.childrenEle[i];
        var pTop = p.offsetTop - this.editorPane.offsetTop;
        var pBottom = pTop + p.offsetHeight;
        if( pTop <= pageH && pBottom > pageH ) {
            oPara = p;
            break;
        } else if( pTop > pageH ) {
            overParas.push(p);
            this.removePTA(p);
        }
    }

    // find the overflow line
    var overLines = [];
    if( oPara ) {
        if( oPara.className == 'oar-paragraph' ) {
            for( var i = oPara.childrenEle.length - 1; i >= 0; --i ) {
                var l = oPara.childrenEle[i];
                var lTop = l.offsetTop - this.editorPane.offsetTop;
                var lBottom = lTop + l.offsetHeight;
                overLines.push(l);
                oPara.removeLine(l);
                if( lTop <= pageH && lBottom > pageH ) {
                    break;
                }
            }

            if( oPara.childrenEle.length == 0 ) {
                this.removePTA(oPara);
            }
        } else if( oPara.className == 'oar-table' ) {
            // slice table
            var overTRs = [];
            var overTRI = -1;
            var removeTRs = [];
            var pageTL = getContainerOffset(this);
            var pageT = pageTL.top + this.headerEle.offsetHeight + this.editorPane.offsetHeight;
            for( var i = oPara.rows.length - 1; i >= 0; --i ) {
                var tr = oPara.rows[i];
                overTRs.push(tr);
                if( i != 0 ) {
                    removeTRs.push(tr);
                }

                var trTL = getContainerOffset(tr);
                if( trTL.top <= pageT ) {
                    overTRI = i;
                    break;
                }
            }

            if( overTRI == 0 ) {
                overParas.unshift(oPara);
                this.removePTA(oPara);
            } else {
                for( var i = 0; i < removeTRs.length; ++i ) {
                    goog.dom.removeNode(removeTRs[i]);
                }

                // handle rowspan
                for( var i = overTRI - 1; i >= 0; --i ) {
                    var tr = oPara.rows[i];

                    for( var j = 0; j < tr.cells.length; ++j ) {
                        var td = tr.cells[j];
                        var rowspan = 1;
                        if( td.rowSpan != null ) {
                            rowspan = parseInt(td.rowSpan);
                        }

                        if( rowspan > 1 ) {
                            var ttri = i + (rowspan - 1);
                            if( ttri >= overTRI ) {
                                td.rowSpan = overTRI - i;
                                td.style.width = td.offsetWidth + 'px';

                                // add new td to over tr
                                var ntd = goog.dom.createDom('td');
                                ntd.rowSpan = rowspan - (overTRI - i);
                                ntd.colSpan = td.colSpan;
                                ntd.style.width = td.offsetWidth + 'px';
                                ntd.style.verticalAlign = 'top';
                                ntd.MERGEUP = true;

                                ntd.appendChild(new PTACell());

                                var lastOverTR = overTRs[overTRs.length - 1];
                                goog.dom.insertSiblingBefore(ntd, lastOverTR.cells[j])
                            }
                        }
                    }
                }

                // create overflow table
                var nTable = new Table(1,1);
                nTable.removeRow(0);

                var nTableC = nTable;
                if( nTable.getElementsByTagName('tbody')[0] ) {
                    nTableC =  nTable.getElementsByTagName('tbody')[0];
                }

                for( var i = overTRs.length - 1; i >= 0; --i ) {
                    nTableC.appendChild(overTRs[i]);
                }

                overParas.unshift(nTable);
            }
        }
    }

    var nPara = null;
    if( overLines.length > 0 ) {
        nPara = new Paragraph();
        nPara.removeLine(nPara.childrenEle[0]);
        for( var i = overLines.length - 1; i >= 0; --i ) {
            nPara.appendLine(overLines[i]);
        }
    }

    if( nPara ) {
        overParas.push(nPara);
    }

    return overParas;
};

Page.getNextPage = function() {
    var next = goog.dom.getNextElementSibling(this);
    while( next != null ) {
        if( next.className && next.className == 'oar-page' ) {
            break;
        } else {
            next = goog.dom.getNextElementSibling(next);
        }
    }

    return next;
};

Page.handleOverflow = function() {
    var overParas = this.sliceOverflow();

    for( var pti = overParas.length - 1; pti >= 0 ; --pti ) {
        var nextPage = this.getNextPage();

        if( overParas[pti].className == 'oar-paragraph' ) {
            if( overParas[pti].hasEOPEnd() ) {
                if( nextPage == null ) {
                    nextPage = new Page();
                    if( nextPage.style.position == 'absolute' ) {
                        nextPage.style.top = (this.offsetTop + this.offsetHeight) + 'px';
                    }

                    if( nextPage.childrenEle[0] ) {
                        nextPage.removePTA(nextPage.childrenEle[0]);
                    }

                    G.doc.insertPageAfter(nextPage, this);
                }

                nextPage.unshiftPTA(overParas[pti]);
            } else {
                if( nextPage ) {
                    var fp = nextPage.getFirstParagraph();
                    if( fp ) {
                        fp.mergeFront(overParas[pti]);
                    }
                }
            }
        } else if( overParas[pti].className == 'oar-table' ) {
            if( nextPage == null ) {
                nextPage = new Page();
                if( nextPage.style.position == 'absolute' ) {
                    nextPage.style.top = (this.offsetTop + this.offsetHeight) + 'px';
                }

                if( nextPage.childrenEle[0] ) {
                    nextPage.removePTA(nextPage.childrenEle[0]);
                }

                G.doc.insertPageAfter(nextPage, this);
            }

            // add or merge table
            var aTable = overParas[pti];
            var aTableRs = aTable.rows.length;
            var fTable =  nextPage.childrenEle[0];
            if( fTable && fTable.className == 'oar-table' ) {
                // merge table
                for( var i = 0; i < aTable.rows.length; ++i ) {
                    goog.dom.insertSiblingBefore(aTable.rows[i], fTable.rows[0]);
                }

                // handle rowspan
                for( var ri = aTableRs - 1; ri >= 0 ; --ri  ) {
                    for( var i = 0; i < fTable.rows[ri].cells.length; ++i ) {
                        if( fTable.rows[ri+1].cells[i] && fTable.rows[ri+1].cells[i].MERGEUP == true ) {
                            var nRowSpan = parseInt(fTable.rows[ri].cells[i].rowSpan) + parseInt(fTable.rows[ri+1].cells[i].rowSpan);

                            goog.dom.removeNode(fTable.rows[ri+1].cells[i]);
                            fTable.rows[ri].cells[i].rowSpan = nRowSpan;

                            if( fTable.rows[ri].cells[i].MERGEUP == true ) {
                                fTable.rows[ri].cells[i].MERGEUP = true;
                            } else {
                                delete  fTable.rows[ri].cells[i].MERGEUP;
                            }
                        }
                    }
                }

            } else {
                nextPage.unshiftPTA(aTable);
            }

        }

        nextPage.handleOverflow();
    }
}

//---------------------------------------------------------------------------------------------------------------------- cursor
var CursorTarget = function(inline, ilh) {
    this.inline = inline;
    this.ilh = ilh;
}
var Cursor = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-cursor';
    ele.style.width = '2px';
    ele.style.height = '20px';
    ele.style.backgroundColor = '#000';
    ele.style.position = 'absolute';
    ele.target = new CursorTarget(null, null);

    asse(ele, Cursor);

    // set blink
    var cblink = function() {
        ele.style.opacity = ele.style.opacity ^ 1;
    };
    setInterval(cblink, 500);
    return ele;
};

Cursor.addTable = function(size) {
    var rows = size.height;
    var cols = size.width;

    var table = new Table(cols, rows);
    var lineC = goog.dom.getParentElement(G.cursor.target.inline);
    var line = goog.dom.getParentElement(lineC);
    var para = goog.dom.getParentElement(line);
    var cell = goog.dom.getParentElement(para);

    cell.insertPTAAfter(table, para);

    cell.insertPTAAfter(new Paragraph(), table);

    table.adjustCellWidth();
    var tPage = cell.getTopPage();
    tPage.handleOverflow();

    G.cursor.refreshTarget();
};

Cursor.setTarget = function(inline, ilh) {
    if( inline.className == 'oar-inline-block' || inline.className == 'oar-inline-eop' || inline.className == 'oar-inline-image' ) {
        this.target.inline = inline;
        this.target.ilh = ilh;

        var so = getContainerOffset(inline);
        this.style.left = so.left + ilh.l + 'px';
        this.style.top = so.top + 'px';
        this.style.height = ilh.h + 'px';
        this.style.opacity = 1;

        G.inputbox.setPosition(G.cursor.offsetLeft, G.cursor.offsetTop, ilh.h);
        G.inputbox.focus();

        if(G.cursor.offsetTop < G.container.scrollTop ) {
            G.container.scrollTop = G.cursor.offsetTop - 5;
        }
    }
};

Cursor.refreshTarget = function() {
    this.setTarget(this.target.inline, this.target.ilh);
};

Cursor.getPreTarget = function() {
    var preTarget = null;
    var preTargetI = 0;
    var target = this.target.inline;
    var targetI = this.target.ilh.i;

    if( targetI > 0 ) {
        preTarget = target;
        preTargetI = targetI - 1;
    } else {
        var preBlock = goog.dom.getPreviousElementSibling(target);
        if( preBlock ) {
            preTarget = preBlock;
            preTargetI = preBlock.textContent.length - 1 >= 0 ?preBlock.textContent.length - 1 : 0;
        } else {
            var lineC = goog.dom.getParentElement(target);
            var line = goog.dom.getParentElement(lineC);
            var preLine = goog.dom.getPreviousElementSibling(line);

            if( preLine ) {
                var lastBlock = preLine.childrenEle[preLine.childrenEle.length - 1];
                preTarget = lastBlock;
                preTargetI = lastBlock.textContent.length - 1 >= 0 ?lastBlock.textContent.length - 1 : 0;
            } else {
                var para = goog.dom.getParentElement(line);
                var prePara = goog.dom.getPreviousElementSibling(para);

                if( prePara != null && prePara.className == 'oar-paragraph' ) {

                    var lastLine = prePara.childrenEle[prePara.childrenEle.length - 1];
                    var lastBlock = lastLine.childrenEle[lastLine.childrenEle.length - 1];
                    preTarget = lastBlock;
                    preTargetI = lastBlock.textContent.length - 1 >= 0 ?lastBlock.textContent.length - 1 : 0;
                } else if( prePara != null && prePara.className == 'oar-table' ) {
                    return null;
                } else if( prePara == null ) {
                    var cell = goog.dom.getParentElement(para);
                    var pc = goog.dom.getParentElement(cell);

                    if( pc.className == 'oar-page-editorpane' ) {
                        var page = goog.dom.getParentElement(pc);
                        var prePage = goog.dom.getPreviousElementSibling(page);;

                        if( prePage != null ) {
                            var lastPara = prePage.childrenEle[prePage.childrenEle.length - 1];

                            if( lastPara != null && lastPara.className == 'oar-paragraph' ) {
                                var lastLine = lastPara.childrenEle[lastPara.childrenEle.length - 1];
                                var lastBlock = lastLine.childrenEle[lastLine.childrenEle.length - 1];
                                preTarget = lastBlock;
                                preTargetI = lastBlock.textContent.length - 1 >= 0 ?lastBlock.textContent.length - 1 : 0;
                            }
                            else {
                                return null;
                            }
                        } else {
                            return null;
                        }

                    } else {
                        return null;
                    }
                }
            }
        }
    }

    if( preTarget ) {
        var wh = {};
        if( preTarget.className == 'oar-inline-block' || preTarget.className == 'oar-inline-eop' ) {
            var cf = getComputedFontStyle(preTarget);
            wh = measureFontTextWH( preTarget.textContent.substring(0, preTargetI), cf.family, cf.size, cf.weight);
            wh.h = preTarget.offsetHeight;
        } else if( preTarget.className == 'oar-inline-image' ) {
            wh.w = 0;
            preTargetI = 0;
            wh.h = preTarget.image.offsetHeight;
        }

        return new CursorTarget(preTarget, new ILH(preTargetI, wh.w, wh.h));
    } else {
        return null;
    }
};

Cursor.getUpTarget = function() {
    var upTarget = null;

    var target = this.target.inline;
    var targetILH = this.target.ilh;

    var lineC = goog.dom.getParentElement(target);
    var line = goog.dom.getParentElement(lineC);
    var preLine = goog.dom.getPreviousElementSibling(line);

    if( preLine ) {
    } else {
        var para = goog.dom.getParentElement(line);
        var prePara = goog.dom.getPreviousElementSibling(para);

        if( prePara && prePara.className == 'oar-paragraph' ) {
            var lastLine = prePara.childrenEle[prePara.childrenEle.length - 1];
            preLine = lastLine;
        } else if( prePara && prePara.className == 'oar-table' ) {

        } else {
            var cell = goog.dom.getParentElement(para);
            var pc = goog.dom.getParentElement(cell);

            if( pc.className == 'oar-page-editorpane' ) {
                var page = goog.dom.getParentElement(pc);
                var prePage = goog.dom.getPreviousElementSibling(page);
                if( prePage && prePage.className == 'oar-page' ) {
                    var lastPara = prePage.childrenEle[prePage.childrenEle.length - 1];

                    if( lastPara && lastPara.className == 'oar-paragraph' ) {
                        var lastLine = lastPara.childrenEle[lastPara.childrenEle.length - 1];
                        preLine = lastLine;
                    }
                }
            }
        }
    }

    if( preLine ) {
        var lt = getContainerOffset(target);
        var plt = getContainerOffset(preLine);
        var x = lt.left + targetILH.l;
        var y = plt.top + preLine.offsetHeight / 2;
        upTarget = preLine.getInlineFromPosition(x, y);

        return new CursorTarget(upTarget, upTarget.getILHFromPosition(x, y));
    } else {
        return null;
    }
};

Cursor.getNextTarget = function() {
    var nextTarget = null;
    var nextTargetI = 0;

    var target = this.target.inline;
    var targetI = this.target.ilh.i;

    if( targetI < target.textContent.length - 1 ) {
        nextTarget = target;
        nextTargetI = targetI + 1;
    } else {
        var nextBlock = goog.dom.getNextElementSibling(target);
        if( nextBlock ) {
            nextTarget = nextBlock;
            nextTargetI = 0;
        } else {
            var lineC = goog.dom.getParentElement(target);
            var line = goog.dom.getParentElement(lineC);
            var nextLine = goog.dom.getNextElementSibling(line);

            if( nextLine ) {
                var firstBlock = nextLine.childrenEle[0];
                nextTarget = firstBlock;
                nextTargetI = 0;
            } else {
                var para = goog.dom.getParentElement(line);
                var nextPara = goog.dom.getNextElementSibling(para);

                if( nextPara && nextPara.className == 'oar-paragraph' ) {
                    var firstLine = nextPara.childrenEle[0];
                    var firstBlock = firstLine.childrenEle[0];
                    nextTarget = firstBlock;
                    nextTargetI = 0;
                } else if( nextPara && nextPara.className == 'oar-table' ) {

                } else {
                    var cell = goog.dom.getParentElement(para);
                    var pc = goog.dom.getParentElement(cell);

                    if( pc.className == 'oar-page-editorpane' ) {
                        var page = goog.dom.getParentElement(pc);
                        var nextPage = goog.dom.getNextElementSibling(page);

                        if( nextPage && nextPage.className == 'oar-page' ) {
                            var nextPara = nextPage.childrenEle[0];
                            if( nextPara && nextPara.className == 'oar-paragraph' ) {
                                var firstLine = nextPara.childrenEle[0];
                                var firstBlock = firstLine.childrenEle[0];
                                nextTarget = firstBlock;
                                nextTargetI = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    if( nextTarget ) {
        var wh = {};
        if( nextTarget.className == 'oar-inline-block' ||  nextTarget.className == 'oar-inline-eop' ) {
            var cf = getComputedFontStyle(nextTarget);
            wh = measureFontTextWH( nextTarget.textContent.substring(0, nextTargetI), cf.family, cf.size, cf.weight);
            wh.h = nextTarget.offsetHeight;
        } else if(  nextTarget.className == 'oar-inline-image' ) {
            nextTargetI = 0;
            wh.w = 0;
            wh.h = nextTarget.image.offsetHeight;
        }

        return new CursorTarget(nextTarget, new ILH(nextTargetI, wh.w, wh.h));
    } else {
        return null;
    }
};

Cursor.getDownTarget = function() {
    var downTarget = null;

    var target = this.target.inline;
    var targetILH = this.target.ilh;

    var lineC = goog.dom.getParentElement(target);
    var line = goog.dom.getParentElement(lineC);
    var nextLine = goog.dom.getNextElementSibling(line);

    if( nextLine ) {
    } else {
        var para = goog.dom.getParentElement(line);
        var nextPara = goog.dom.getNextElementSibling(para);

        if( nextPara && nextPara.className == 'oar-paragraph' ) {
            var firstLine = nextPara.childrenEle[0];
            nextLine = firstLine;
        } else if( nextPara && nextPara.className == 'oar-table' ) {

        } else {
            var cell = goog.dom.getParentElement(para);
            var pc = goog.dom.getParentElement(cell);

            if( pc.className == 'oar-page-editorpane' ) {
                var page = goog.dom.getParentElement(pc);
                var nextPage = goog.dom.getNextElementSibling(page);

                if( nextPage && nextPage.className == 'oar-page' ) {
                    var firstPara = nextPage.childrenEle[0];

                    if( firstPara && firstPara.className == 'oar-paragraph' ) {
                        var firstLine = firstPara.childrenEle[0];
                        nextLine = firstLine;
                    }
                }
            }
        }
    }

    if( nextLine ) {
        var lt = getContainerOffset(target);
        var nlt = getContainerOffset(nextLine);
        var x = lt.left + targetILH.l;
        var y = nlt.top + nextLine.offsetHeight / 2;
        downTarget = nextLine.getInlineFromPosition(x, y);

        return new CursorTarget(downTarget, downTarget.getILHFromPosition(x, y));
    } else {
        return null;
    }
};

//---------------------------------------------------------------------------------------------------------------------- range select
var RangeSEP = function() {
    this.sp = {x:0, y:0};
    this.ep = {x:0, y:0};
};

var RangeSelector = function() {
    var ele = goog.dom.createDom('div');
    asse(ele, RangeSelector);
    ele.className = 'oar-rangeselector';
    ele.style.position = 'absolute';
    ele.style.width = '0px';
    ele.style.height = '0px';
    //ele.style.backgroundColor = 'rgb(0, 143, 255)';
    ele.style.border = '1px solid rgb(0, 143, 255)';
    ele.style.opacity = 0.4;
    ele.style.visibility = 'hidden';
    ele.style.webkitUserSelect = 'none';
    ele.foLine = null; // indecate first overlay line

    return ele;
};

RangeSelector.deleteBlocksInRange = function() {
    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    var line = G.rangeSelector.foLine;
    var nextLine = null;
    var oldLine = line;
    var para = null;
    var nextPara = null;
    var oldPage = null;
    if( line ) {
        para = goog.dom.getParentElement(line);
        var cell = goog.dom.getParentElement(para);
        oldPage = cell.getTopPage();
    }

    while( line != null && line.hasOverlay() ) {
        for( var i = 0; i < line.childrenEle.length; ++i ) {
            var block = line.childrenEle[i];

            if( block.className && block.className == 'oar-inline-block' ) {
                var blockStyle = block.getBlockStyle();
                var blockLeft = null;
                var blockRight = null;
                var bCut = false;

                if( block.overlay.si > 0 ) {
                    blockLeft = new InlineBlock();
                    blockLeft.textContent = block.textContent.substring(0, block.overlay.si);
                    blockLeft.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( block.overlay.ei >= 0 && block.overlay.ei < block.textContent.length - 1 ) {
                    blockRight = new InlineBlock();
                    blockRight.textContent = block.textContent.substring(block.overlay.ei + 1);
                    blockRight.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( bCut ) {
                    block.textContent = block.textContent.substring(block.overlay.si, block.overlay.ei + 1);
                    if( blockLeft ) {
                        line.insertBlockBefore(blockLeft, block);
                        block.overlay.si = 0;
                        ++i;
                    }
                    if( blockRight ) {
                        line.insertBlockAfter(blockRight, block);
                        block.overlay.ei =  block.textContent.length - 1;
                        ++i;
                    }
                }
                if( block.overlay.si >= 0 ) {
                    line.removeBlock(block);
                    --i;
                }

            } else if( block.className && block.className == 'oar-inline-image' ) {
                if( block.overlay.si >= 0 ) {
                    line.removeBlock(block);
                    --i;
                }
            } else if( block.className && block.className == 'oar-inline-eop' ) {
                //if( oldLine == line ) {
                    if( block.overlay.si >= 0 ) {
                        line.removeBlock(block);
                        --i;
                    }
                //}
            }
        }

        nextLine = line.getNextLineThroughPageTdAvoidTable();
        if( nextLine ) {
            nextPara = goog.dom.getParentElement(nextLine);
        } else {
            nextPara = null;
        }

        if( line.childrenEle.length == 0 ) {
            para.removeLine(line);
        } else {
            line.ClearOverlayLayer();
        }

        var pc = goog.dom.getParentElement(para);
        if( para.childrenEle.length == 0 || (para.childrenEle[0] && para.childrenEle[0].childrenEle[0] && para.childrenEle[0].childrenEle[0].className == 'oar-inline-eop') ) {
            cell.removePTA(para);
        }

        if( pc.childrenEle.length == 0 ) {
            pc.appendPTA(new Paragraph());
        }

        line = nextLine;
        para = nextPara;
    }

    // after deal
    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    var oldLineC = goog.dom.getParentElement(newCursorP.inline);
    oldLine = goog.dom.getParentElement(oldLineC);
    if( oldLine ) {
        oldLine.handleWidthLack();
        oldLine.handleLineAlign();
        oldLine.ClearOverlay();
    }

    if( oldPage ) {
        oldPage.handleWidthLack();
    }

    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);

    G.rangeSelector.foLine = null;
}

RangeSelector.cutBlocksInRange = function() {
    var copySet = [];

    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    var line = G.rangeSelector.foLine;
    var nextLine = null;
    var oldLine = line;
    var para = null;
    var nextPara = null;
    var oldPage = null;
    if( line ) {
        para = goog.dom.getParentElement(line);
        var cell = goog.dom.getParentElement(para);
        oldPage = cell.getTopPage();
    }

    while( line != null && line.hasOverlay() ) {
        for( var i = 0; i < line.childrenEle.length; ++i ) {
            var block = line.childrenEle[i];

            if( block.className && block.className == 'oar-inline-block' ) {
                var blockStyle = block.getBlockStyle();
                var blockLeft = null;
                var blockRight = null;
                var bCut = false;

                if( block.overlay.si > 0 ) {
                    blockLeft = new InlineBlock();
                    blockLeft.textContent = block.textContent.substring(0, block.overlay.si);
                    blockLeft.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( block.overlay.ei >= 0 && block.overlay.ei < block.textContent.length - 1 ) {
                    blockRight = new InlineBlock();
                    blockRight.textContent = block.textContent.substring(block.overlay.ei + 1);
                    blockRight.setBlockStyle(blockStyle);
                    bCut = true;
                }

                if( bCut ) {
                    block.textContent = block.textContent.substring(block.overlay.si, block.overlay.ei + 1);
                    if( blockLeft ) {
                        line.insertBlockBefore(blockLeft, block);
                        block.overlay.si = 0;
                        ++i;
                    }
                    if( blockRight ) {
                        line.insertBlockAfter(blockRight, block);
                        block.overlay.ei =  block.textContent.length - 1;
                        ++i;
                    }
                }
                if( block.overlay.si >= 0 ) {
                    G.doc.deleteTargetBlock(block, true);
                    copySet.push(block);
                    --i;


                }

            } else if( block.className && block.className == 'oar-inline-image' ) {
                if( block.overlay.si >= 0 ) {
                    G.doc.deleteTargetBlock(block, true);
                    copySet.push(block);
                    --i;
                }
            } else if( block.className && block.className == 'oar-inline-eop' ) {
                if( block.overlay.si >= 0 ) {
                    G.doc.deleteTargetBlock(block, true);
                    copySet.push(block);
                    --i;
                }
            }
        }

        nextLine = line.getNextLineThroughPageTdAvoidTable();
        if( nextLine ) {
            nextPara = goog.dom.getParentElement(nextLine);
        } else {
            nextPara = null;
        }

        if( line.childrenEle.length == 0 ) {
            para.removeLine(line);
        } else {
            line.ClearOverlayLayer();
        }

        var pc = goog.dom.getParentElement(para);
        if( para.childrenEle.length == 0 || (para.childrenEle[0] && para.childrenEle[0].childrenEle[0] && para.childrenEle[0].childrenEle[0].className == 'oar-inline-eop') ) {
            cell.removePTA(para);
        }

        if( pc.childrenEle.length == 0 ) {
            pc.appendPTA(new Paragraph());
        }

        line = nextLine;
        para = nextPara;
    }

    // after deal
    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    var oldLineC = goog.dom.getParentElement(newCursorP.inline);
    oldLine = goog.dom.getParentElement(oldLineC);
    if( oldLine ) {
        oldLine.handleWidthLack();
        oldLine.handleLineAlign();
        oldLine.ClearOverlay();
    }

    if( oldPage ) {
        oldPage.handleWidthLack();
    }

    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);

    G.rangeSelector.foLine = null;

    G.copySet = copySet;
    return copySet;
}

RangeSelector.copyBlocksInRange = function() {
    var copySet = [];

    var line = G.rangeSelector.foLine;
    var nextLine = null;
    var oldLine = line;
    var para = null;
    var nextPara = null;
    var oldPage = null;
    if( line ) {
        para = goog.dom.getParentElement(line);
        var cell = goog.dom.getParentElement(para);
        oldPage = cell.getTopPage();
    }

    while( line != null && line.hasOverlay() ) {
        for( var i = 0; i < line.childrenEle.length; ++i ) {
            var block = line.childrenEle[i];

            if( block.className && block.className == 'oar-inline-block' ) {
                var blockStyle = block.getBlockStyle();
                var blockCopy = new InlineBlock();
                blockCopy.setBlockStyle(blockStyle);
                var bCut = false;

                if( block.overlay.si >= 0 ) {
                    blockCopy.textContent = block.textContent.substring(block.overlay.si, block.overlay.ei + 1);
                    copySet.push(blockCopy);
                }

            } else if( block.className && block.className == 'oar-inline-image' ) {
                if( block.overlay.si >= 0 ) {
                    var imgCopy = new InlineImage();
                    imgCopy.setSource(block.image.src);
                    copySet.push(imgCopy);
                }
            } else if( block.className && block.className == 'oar-inline-eop' ) {
                if( block.overlay.si >= 0 ) {
                    copySet.push(new InlineEOP());
                }
            }
        }

        nextLine = line.getNextLineThroughPageTdAvoidTable();
        if( nextLine ) {
            nextPara = goog.dom.getParentElement(nextLine);
        } else {
            nextPara = null;
        }

        if( line.childrenEle.length == 0 ) {
            para.removeLine(line);
        }

        var pc = goog.dom.getParentElement(para);
        if( para.childrenEle.length == 0 || (para.childrenEle[0] && para.childrenEle[0].childrenEle[0] && para.childrenEle[0].childrenEle[0].className == 'oar-inline-eop') ) {
            cell.removePTA(para);
        }

        if( pc.childrenEle.length == 0 ) {
            pc.appendPTA(new Paragraph());
        }

        line = nextLine;
        para = nextPara;
    }

    G.copySet = copySet;
    return copySet;
}

RangeSelector.freshRangeOverlay = function() {
    this.foLine.ClearOverlayLayer();
    this.foLine.CreateOverlayLayer();

    // line in page or table
    var para = goog.dom.getParentElement(this.foLine);
    var cell = goog.dom.getParentElement(para);
    var pc = goog.dom.getParentElement(cell);

    if( pc.tagName.toLowerCase() == 'td' ) {
        var nextLine = this.foLine.getNextLineThroughPageTdAvoidTable();
        while( nextLine ) {
            if( nextLine.hasOverlay() ) {
                nextLine.ClearOverlayLayer();
                nextLine.CreateOverlayLayer();
            }

            nextLine = nextLine.getNextLineThroughPageTdAvoidTable();
        }
    } else {
        var nextLine = this.foLine.getNextLineThroughPageTdAvoidTable();
        while( nextLine && nextLine.hasOverlay() ) {
            nextLine.ClearOverlayLayer();
            nextLine.CreateOverlayLayer();
            nextLine = nextLine.getNextLineThroughPageTdAvoidTable();
        }
    }
};

RangeSelector.createRangeOverlay = function(e, x0, y0, target0) {
    // create select range overlay
    var x = e.clientX - G.container.offsetLeft + G.container.scrollLeft;
    var y = e.clientY - G.container.offsetTop + G.container.scrollTop;

    if( y < y0 ) {
        var yt = y0;
        var xt = x0;

        x0 = x;
        y0 = y;
        x = xt;
        y = yt;
    }

    // find all sibling cell in range
    if( target0.tagName == 'td' ||
        (target0.className &&
            ( target0.className == 'oar-line-content' ||
                target0.className == 'oar-inline-block' ||
                target0.className == 'oar-page-editorpane'
                )
            ) ) {

        var tCell = null;
        var bCellInTable = false;
        if( target0.tagName == 'td' ) {
            tCell = target0.getElementsByClassName('oar-pta-cell')[0];
            bCellInTable = true;
        } else {
            var tLine = null;
            if( target0.className && target0.className == 'oar-inline-block' ) {
                var tLineC = goog.dom.getParentElement(target0);
                tLine = goog.dom.getParentElement(tLineC)
            } else if( target0.className && target0.className == 'oar-line-content' ) {
                tLine = goog.dom.getParentElement(target0);
            }

            if( tLine != null ) {
                var tPara = goog.dom.getParentElement(tLine);
                var tCell = goog.dom.getParentElement(tPara);
                var pc = goog.dom.getParentElement(tCell);

                if( pc.tagName.toLowerCase() == 'td' ) {
                    bCellInTable = true;
                }
            } else {
                if( target0.className && target0.className == 'oar-page-editorpane' ) {
                    tCell = target0.getElementsByClassName('oar-pta-cell')[0];
                }
            }
        }

        // page or table sibling cells
        var needCells = [];
        var needCellRanges = [];

        if( bCellInTable ) {
            var tT = goog.dom.getParentElement(tCell);
            while( tT.tagName.toLowerCase() != 'table' ) {
                tT = goog.dom.getParentElement(tT);
            }

            for( var ir = 0; ir < tT.rows.length; ++ir ) {
                for( var ic = 0; ic < tT.rows[ir].cells.length; ++ic ) {
                    var cc = tT.rows[ir].cells[ic];
                    var ccTL = getContainerOffset(cc);

                    if( ccTL.top < y && ccTL.top + cc.offsetHeight > y0 &&
                        ccTL.left < x && ccTL.left + cc.offsetWidth > x0 ) {

                        var ccCellRangeTop = Math.max(ccTL.top, y0);
                        var ccCellRangeBottom = Math.min(ccTL.top + cc.offsetHeight, y);
                        var ccCellRangeTx = Math.max(ccTL.left, x0);
                        var ccCellRangeBx = Math.min(ccTL.left + cc.offsetWidth, x);

                        var pr = new RangeSEP();
                        pr.sp.x = ccCellRangeTx;
                        pr.sp.y = ccCellRangeTop;
                        pr.ep.x = ccCellRangeBx;
                        pr.ep.y = ccCellRangeBottom;
                        needCells.push(cc.getElementsByClassName('oar-pta-cell')[0]);
                        needCellRanges.push(pr);
                    }
                }
            }
        } else {
            var tPc = goog.dom.getParentElement(tCell);
            var tPage = goog.dom.getParentElement(tPc);

            var bDo = false;
            for( var ip = 0; ip < G.doc.childrenEle.length; ++ip ) {
                var pp = G.doc.childrenEle[ip];
                if( tPage == pp ) {
                    bDo = true;
                }

                if( bDo ) {
                    var ppCell = pp.editorPane.getElementsByClassName('oar-pta-cell')[0];
                    var ppCellTL = getContainerOffset(ppCell);
                    if( ppCellTL.top + ppCell.offsetHeight > y0 || ppCellTL.top < y ) {
                        var ppCellRangeTop = Math.max(ppCellTL.top, y0);
                        var ppCellRangeBottom = Math.min(ppCellTL.top + ppCell.offsetHeight, y);
                        var ppCellRangeTx = 0;
                        var ppCellRangeBx = 0;

                        if( ppCellTL.top > y0 ) {
                            ppCellRangeTx = ppCellTL.left;
                        } else {
                            ppCellRangeTx = x0;
                        }

                        if( ppCellTL.top + ppCell.offsetHeight < y ) {
                            ppCellRangeBx = ppCellTL.left + ppCell.offsetWidth;
                        } else {
                            ppCellRangeBx = x;
                        }

                        var pr = new RangeSEP();
                        pr.sp.x = ppCellRangeTx;
                        pr.sp.y = ppCellRangeTop;
                        pr.ep.x = ppCellRangeBx;
                        pr.ep.y = ppCellRangeBottom;

                        needCells.push(ppCell);
                        needCellRanges.push(pr);
                    }
                }
            }
        }

        // for each cell find 1st class children in range and put overlay into line block
        var foLine = null;
        for( var rgi = 0; rgi < needCells.length; ++rgi ) {
            for( var rgpi = 0; rgpi < needCells[rgi].childrenEle.length; ++rgpi ) {
                var rgp = needCells[rgi].childrenEle[rgpi];
                if( rgp.className && rgp.className == 'oar-paragraph' ) {
                    for( var rgpli = 0; rgpli < rgp.childrenEle.length; ++rgpli ) {
                        var rgpl = rgp.childrenEle[rgpli];

                        var rgplTL = getContainerOffset(rgpl);
                        if( rgplTL.top < needCellRanges[rgi].ep.y &&
                            rgplTL.top + rgpl.offsetHeight > needCellRanges[rgi].sp.y ) {

                            if( foLine == null ) {
                                foLine = rgpl;
                            }

                            // line in range
                            var rgplOLeft = 0;
                            var rgplORight = 0;

                            if( rgplTL.top > needCellRanges[rgi].sp.y ) {
                                rgplOLeft = rgpl.offsetLeft;
                            } else {
                                rgplOLeft = needCellRanges[rgi].sp.x - rgplTL.left + rgpl.offsetLeft;
                            }

                            if( rgplTL.top + rgpl.offsetHeight > needCellRanges[rgi].ep.y ) {
                                rgplORight = needCellRanges[rgi].ep.x - rgplTL.left + rgpl.offsetLeft;
                            } else {
                                rgplORight = rgpl.offsetLeft + rgpl.getChildrenWidthEOP();
                            }

                            if( rgplORight - rgplOLeft > 0 ) {
                                rgpl.CreateOverlay(rgplOLeft - rgpl.offsetLeft, rgplORight - rgpl.offsetLeft);
                            }
                        }
                    }
                }
            }
        }

        // store first overlay line
        this.foLine = foLine;
    }
};

RangeSelector.clearRangeOverlay = function() {
    if( this.foLine == null ) {
        return;
    }

    this.foLine.ClearOverlay();

    // line in page or table
    var para = goog.dom.getParentElement(this.foLine);
    var cell = goog.dom.getParentElement(para);
    var pc = goog.dom.getParentElement(cell);

    if( pc.tagName.toLowerCase() == 'td' ) {
        var nextLine = this.foLine.getNextLineThroughPageTdAvoidTable();
        while( nextLine ) {
            if( nextLine.hasOverlay() ) {
                nextLine.ClearOverlay();
            }

            nextLine = nextLine.getNextLineThroughPageTdAvoidTable();
        }
    } else {
        var nextLine = this.foLine.getNextLineThroughPageTdAvoidTable();
        while( nextLine && nextLine.hasOverlay() ) {
            nextLine.ClearOverlay();
            nextLine = nextLine.getNextLineThroughPageTdAvoidTable();
        }
    }

    this.foLine = null;
}

//---------------------------------------------------------------------------------------------------------------------- input box
var InputBox = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-inputbox';
    ele.style.position = 'absolute';
    ele.contentEditable = true;
    ele.style.pointerEvents = 'none';
    ele.style.opacity = 0;
    //ele.style.width = '0px';
    //ele.style.border = '1px solid #FF0000';
    //ele.style.outline = '0px';
    ele.ime = false;
    ele.dummyR = null;
    ele.dummyInner = null;

    asse(ele, InputBox);

    // handle input, ime, keydown
    goog.events.listen(ele, goog.events.EventType.INPUT, InputBox.inputHandler);
    if( BrowserDetect.browser == 'Explorer' ) {
        ele.addEventListener("DOMCharacterDataModified", InputBox.inputHandler, false); // IE hack
    }
    goog.events.listen(new goog.events.ImeHandler(ele),
        goog.object.getValues(goog.events.ImeHandler.EventType), InputBox.imeHandler);
    goog.events.listen(ele, goog.events.EventType.KEYDOWN,InputBox.keydownHandler);

    return ele;
};

InputBox.imeHandler = function(e) {
    if(e.type == 'startIme' ) {
        G.inputbox.ime = true;
        G.cursor.style.visibility = 'hidden';
    } else if(e.type == 'endIme' ) {
        G.inputbox.ime = false;
        G.cursor.style.visibility = 'visible';

        if( G.inputbox.dummyR ) {
            var tb = G.cursor.target.inline;
            tb.textContent += G.inputbox.dummyR.textContent;

            goog.dom.removeNode(G.inputbox.dummyR);
            G.inputbox.dummyR = null;
        }

        if( G.inputbox.dummyInner ) {
            goog.dom.removeNode(G.inputbox.dummyInner);
            G.inputbox.dummyInner = null;
        }
    } if(e.type == 'updateIme') {
    }
}
InputBox.inputHandler = function(e) {
    // delete range
    if(G.rangeSelector.foLine != null && G.rangeSelector.foLine.hasOverlay() ) {
        G.rangeSelector.deleteBlocksInRange();
    }

    if( this.ime ) {
        // ime update
        var ff = G.toolbar.getFontFamily();
        var fs = G.toolbar.getFontSize() + 'px';

        G.inputbox.style.fontFamily = ff;
        G.inputbox.style.fontSize = fs;

        // for update input
        var ti = G.cursor.target.ilh.i;
        var tb = G.cursor.target.inline;
        var tbt = tb.textContent;

        if( ti == 0 ) {
            // inner input
            if( G.inputbox.dummyInner == null ) {
                G.inputbox.dummyInner = goog.dom.createDom('span');
                //G.inputbox.dummyInner.style.border = '1px solid #0000FF';
                G.inputbox.dummyInner.style.fontFamily = ff;
                G.inputbox.dummyInner.style.fontSize = fs;
                G.inputbox.dummyInner.style.textDecoration = 'underline';
                goog.dom.insertSiblingBefore(G.inputbox.dummyInner, tb);
            }

            G.inputbox.dummyInner.textContent = G.inputbox.textContent;
        } else {
            // dummy right
            if( G.inputbox.dummyR == null ) {
                var tbtL = tbt.substring(0, ti);
                var tbtR = tbt.substring(ti);
                tb.textContent = tbtL;

                G.inputbox.dummyR = new InlineBlock();
                G.inputbox.dummyR.textContent = tbtR;
                G.inputbox.dummyR.setBlockStyle(tb.getBlockStyle());
                goog.dom.insertSiblingAfter(G.inputbox.dummyR, tb);
            }

            // inner input
            if( G.inputbox.dummyInner == null ) {
                G.inputbox.dummyInner = goog.dom.createDom('span');
                //G.inputbox.dummyInner.style.border = '1px solid #0000FF';
                G.inputbox.dummyInner.style.fontFamily = ff;
                G.inputbox.dummyInner.style.fontSize = fs;
                G.inputbox.dummyInner.style.textDecoration = 'underline';
                goog.dom.insertSiblingAfter(G.inputbox.dummyInner, tb);
            }

            G.inputbox.dummyInner.textContent = G.inputbox.textContent;
        }

        return;
    }

    var text = this.textContent;
    this.textContent = '';

    for( var i = 0; i < text.length; ++i ) {
        var c = text[i];
        var blockStyle = G.toolbar.getBlockStyle();

        var ct = G.cursor.target;

        // insert before BLOCK
        G.doc.inputCharBefore(c, blockStyle, ct, true);
    }
}

InputBox.keydownHandler = function(e) {
    var target = G.cursor.target.inline;
    var ti = G.cursor.target.ilh.i;
    var lineC = goog.dom.getParentElement(target);
    var line = goog.dom.getParentElement(lineC);
    var para = goog.dom.getParentElement(line);
    var cell = goog.dom.getParentElement(para);

    if(e.ctrlKey ) {
        e.stopPropagation();
        e.preventDefault();
    }

    switch(e.keyCode) {
        // hot kes: ctrl+f
        case 70: {
            if(e.ctrlKey ) {
            }
            break;
        }
        // hot keys: ctrl+z
        case 90: {
            if( e.ctrlKey ) {
                G.history.undo();
            }

            break;
        }
        // hot keys: ctrl+y
        case 89: {
            if( e.ctrlKey ) {
                G.history.redo();
            }

            break;
        }
        // hot keys: ctrl+c
        case 67: {
            if( e.ctrlKey ) {
                G.rangeSelector.copyBlocksInRange();
            }

            break;
        }
        // hot keys: ctrl+v
        case 86: {
            if( e.ctrlKey ) {
                if(G.copySet && G.copySet.length > 0 ) {
                    G.doc.pasteBlocks(G.copySet);
                }
            }

            break;
        }
        // hot keys: ctrl+x
        case 88: {
            if( e.ctrlKey ) {
                G.rangeSelector.cutBlocksInRange();
            }

            break;
        }

        // key delete
        case 8:
        {
            if(G.rangeSelector.foLine != null && G.rangeSelector.foLine.hasOverlay() ) {
                G.rangeSelector.deleteBlocksInRange();
            } else {
                G.doc.deleteCBefore();
            }

            break;
        }
        // key enter
        case 13:
        {
            G.doc.inputEnter(G.cursor.target, true);

            break;
        }
        // left
        case 37:
        {
            var preTarget = G.cursor.getPreTarget();
            if( preTarget ) {
                G.cursor.setTarget(preTarget.inline, preTarget.ilh);
            }

            break;
        }
        // up
        case 38:
        {
            var upTarget = G.cursor.getUpTarget();
            if( upTarget ) {
                G.cursor.setTarget(upTarget.inline, upTarget.ilh);
            }

            break;
        }
        // right
        case 39:
        {
            var nextTarget = G.cursor.getNextTarget();
            if( nextTarget ) {
                G.cursor.setTarget(nextTarget.inline, nextTarget.ilh);
            }

            break;
        }
        // down
        case 40:
        {
            var downTarget = G.cursor.getDownTarget();
            if( downTarget ) {
                G.cursor.setTarget(downTarget.inline, downTarget.ilh);
            }

            break;
        }
    }
}

InputBox.setPosition = function(x, y, h) {
    this.style.left = x + 'px';
    this.style.top = y + 'px';
    this.style.height = h + 'px';
}

//---------------------------------------------------------------------------------------------------------------------- doc
var Doc = function() {
    var ele = goog.dom.createDom('div');
    ele.className = 'oar-doc';
    ele.style.webkitUserSelect = 'none';
    asse(ele, Doc);
    ele.childrenEle = []; // pages, cursor
    ele.cursor = null;

    // add mousedown event handler
    goog.events.listen(ele, goog.events.EventType.MOUSEDOWN, Doc.mouseDownHandler);

    return ele;
};

// x0 and y0 against to container
Doc.getTargetFromPosition = function(x0, y0) {
    var page = this.getPageFromPosition(x0, y0);
    var pta = page.getPTAFromPosition(x0, y0);
    var block = null;
    var ilh = null;

    if( pta.className == 'oar-paragraph' ) {
        var line = pta.getLineFromPosition(x0, y0);
        block = line.getInlineFromPosition(x0, y0);
        if( block.className && block.className == 'oar-inline-eop' ) {
            ilh = new ILH(0, 0, block.offsetHeight);
        } else if( block.className && block.className == 'oar-inline-image' ) {
            ilh = new ILH(0, 0, line.offsetHeight);
        } else {
            ilh = block.getILHFromPosition(x0, y0);
        }

    } else if(pta.className == 'oar-table') {
        var cell = pta.getCellFromPosition(x0, y0);
        var pt2 = cell.getPTAFromPosition(x0, y0);
        var line = pt2.getLineFromPosition(x0, y0);
        block = line.getInlineFromPosition(x0, y0);
        if( block.className && block.className == 'oar-inline-eop' ) {
            ilh = new ILH(0, 0, block.offsetHeight);
        } else {
            ilh = block.getILHFromPosition(x0, y0);
        }
    }


    return new CursorTarget(block, ilh);
}

Doc.mouseDownHandler = function(e) {
    if(  e.button != 0 ) { // not left button
        return;
    }
    // cursor position
    var x0 = e.clientX - G.container.offsetLeft + G.container.scrollLeft;
    var y0 = e.clientY - G.container.offsetTop + G.container.scrollTop;

    if(e.target.className && (e.target.className.lastIndexOf('oar-inline-image') > -1 ||
        e.target.className.lastIndexOf('oar-table-resizer') > -1 ) ) {
        return;
    } else {
        if( G.iamgeResizer ) {
            G.iamgeResizer.style.visibility = 'hidden';
        }
    }

    G.rangeSelector.clearRangeOverlay();
    var ttg = G.doc.getTargetFromPosition(x0, y0);
    G.cursor.setTarget(ttg.inline, ttg.ilh) ;

    // target style
    var ttgLineC = goog.dom.getParentElement(ttg.inline);
    var ttgLine = goog.dom.getParentElement(ttgLineC);
    var ttgPara = goog.dom.getParentElement(ttgLine);
    var ttgParaStyle = ttgPara.getParagraphStyle();
    if( ttg.inline.className == 'oar-inline-block' || ttg.inline.className == 'oar-inline-eop' ) {
        if( ttg.inline.className == 'oar-inline-eop' ) {
            var ttgBlockStyle = null;
            var prettg = goog.dom.getPreviousElementSibling(ttg.inline);
            if( prettg && prettg.className == 'oar-inline-block' ) {
                ttgBlockStyle = prettg.getBlockStyle();
            } else {
                ttgBlockStyle = new BlockStyle("", "", "");
            }
        } else {
            ttgBlockStyle = ttg.inline.getBlockStyle();
        }

        if( ttgBlockStyle != null ) {
            G.toolbar.setStyle(ttgBlockStyle, ttgParaStyle);
        }
    }

    // range selector
    var d = new goog.fx.Dragger(this);
    var target0 = e.target;

    //G.rangeSelector.style.visibility = 'visible';
    G.rangeSelector.style.left = x0 + 'px';
    G.rangeSelector.style.top = y0 + 'px';
    G.rangeSelector.style.width = '0px';
    G.rangeSelector.style.height = '0px';

    d.addEventListener(goog.fx.Dragger.EventType.DRAG, function(e) {
        var x = e.clientX - G.container.offsetLeft + G.container.scrollLeft;
        var y = e.clientY - G.container.offsetTop + G.container.scrollTop;

        var top = Math.min(y, y0);
        var left = Math.min(x, x0);
        var right = Math.max(x, x0);
        var bottom = Math.max(y, y0);

        G.rangeSelector.style.left = left + 'px';
        G.rangeSelector.style.top = top + 'px';
        G.rangeSelector.style.width = Math.abs(x-x0) + 'px';
        G.rangeSelector.style.height = Math.abs(y-y0) + 'px';

        G.rangeSelector.clearRangeOverlay();
        G.rangeSelector.createRangeOverlay(e, x0, y0, target0);
    });

    d.addEventListener(goog.fx.Dragger.EventType.END, function(e) {
        var x = e.clientX - G.container.offsetLeft + G.container.scrollLeft;
        var y = e.clientY - G.container.offsetTop + G.container.scrollTop;

        var top = Math.min(y, y0);
        var left = Math.min(x, x0);
        var right = Math.max(x, x0);
        var bottom = Math.max(y, y0);

        G.rangeSelector.style.left = left + 'px';
        G.rangeSelector.style.top = top + 'px';
        G.rangeSelector.style.width = Math.abs(x-x0) + 'px';
        G.rangeSelector.style.height = Math.abs(y-y0) + 'px';
        G.rangeSelector.style.width = '0px';
        G.rangeSelector.style.height = '0px';
        //G.rangeSelector.style.visibility = 'hidden';

        G.rangeSelector.clearRangeOverlay();
        G.rangeSelector.createRangeOverlay(e, x0, y0, target0);

        d.dispose();
    });
    d.startDrag(e);
}

// if no return last
Doc.getPageFromPosition = function(x, y) {
    var child;
    for( var i = 0; i < this.childrenEle.length; ++i) {
        child = this.childrenEle[i];
        if( child.className == 'oar-page' ) {
            var top = child.offsetTop;
            var left = child.offsetLeft;
            if( top < y && child.offsetHeight + top > y &&
                left < x && child.offsetWidth + left > x) {
                return child;
            }
        }
    }

    return child;
}

Doc.adjustHeight = function() {
    this.style.height = this.childrenEle.length * (Page.fixedHeight + 9) + 5 + 'px';
};

Doc.traverseToString = function() {
    // traverse the doc
    var doc = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "doc", null);
    var docX = doc.documentElement;

    var preX = null;
    for( var pi = 0; pi < G.doc.childrenEle.length; ++pi) {
        var page = G.doc.childrenEle[pi];
        if( page.className == 'oar-page' ) {
            preX = traverseCellToXmlNode(page, docX, preX);
        }
    }

    var xmlDocX = new XMLSerializer().serializeToString(doc);
    return xmlDocX;
}

Doc.inputEnter = function(tg, aHistory) {
    var target = tg.inline;
    var ti = tg.ilh.i;
    var lineC = goog.dom.getParentElement(target);
    var line = goog.dom.getParentElement(lineC);
    var para = goog.dom.getParentElement(line);
    var cell = goog.dom.getParentElement(para);

    // split after part
    var textL = target.textContent.substring(0, ti);
    var textR = target.textContent.substring(ti);
    var overBlocks = [];
    var removeLines = [];

    for( var i = para.childrenEle.length - 1; i >= 0; --i ) {
        var cl = para.childrenEle[i];
        if( cl != line ) {
            for( var j = cl.childrenEle.length - 1; j >= 0; --j ) {
                overBlocks.push(cl.childrenEle[j]);
                cl.removeBlock(cl.childrenEle[j]);
            }

            if( cl.childrenEle.length <= 1 ) {
                para.removeLine(cl);
            }
        } else {
            // same line
            for( var j = line.childrenEle.length - 1; j >= 0; --j ) {
                if( line.childrenEle[j] != target ) {
                    overBlocks.push(line.childrenEle[j]);
                    line.removeBlock(line.childrenEle[j]);
                } else {
                    //same block
                    if( target.className != 'oar-inline-eop' ) {
                        // new block
                        if( target.className == 'oar-inline-block' ) {
                            target.textContent = textL;
                            var blockR = new InlineBlock();
                            blockR.textContent = textR;
                            blockR.setBlockStyle(target.getBlockStyle());
                            overBlocks.push(blockR);
                        } else if( target.className == 'oar-inline-image' ) {
                            overBlocks.push(target);
                            line.removeBlock(target);
                        }
                        break;
                    } else {
                        overBlocks.push(target);
                        line.removeBlock(target);
                    }
                    break;
                }
            }
            break;
        }
    }

    line.appendBlock(new InlineEOP());

    var np = new Paragraph();
    cell.insertPTAAfter(np, para);
    var npLine = np.childrenEle[0];
    npLine.removeBlock(npLine.childrenEle[npLine.childrenEle.length - 1]);
    npLine.handleLineAlign();
    line.handleLineAlign();

    for( var i = 0; i < overBlocks.length; ++i ) {
        npLine.unshiftBlock(overBlocks[i]);
    }

    // handle line overflow
    npLine.handleLineAlign();
    npLine.handleOverflow();

    // handle page overflow
    var page = npLine.getPage();
    if( page ) {
        page.handleOverflow();
    }

    var npLineBlock = npLine.childrenEle[0];
    var nILH = new ILH(0, 0, npLineBlock.offsetHeight);
    G.cursor.setTarget(npLineBlock, nILH);

    if( aHistory ) {
        var reTL = getContainerOffset(target);
        var unTL = getContainerOffset(G.cursor.target.inline);

        var redo = new AH_Insert(new InlineEOP(), reTL.left + tg.ilh.l , reTL.top );
        var undo = new AH_Delete(unTL.left + G.cursor.target.ilh.l , unTL.top, true, true);
        G.history.appendAction(undo, redo);
    }
}

Doc.changeStyle = function(block, blockStyle, line, paraStyle, aHistory) {
    if( aHistory == false ) {
        G.rangeSelector.clearRangeOverlay();
    }

    var oldCursorP = getContainerOffset(G.cursor.target.inline);
    oldCursorP.left += G.cursor.target.ilh.l;

    var oldbs = null;
    var oldps = null;
    var para = null;
    var page = null;

    if( blockStyle ) {
        var blineC = goog.dom.getParentElement(block);
        var bline = goog.dom.getParentElement(blineC);
        para = goog.dom.getParentElement(bline);
        page = bline.getPage();

        oldbs = block.getBlockStyle();
        block.setBlockStyle(blockStyle);

        bline.handleOverflow();
        bline.handleWidthLack();

        page.handleOverflow();
        page.handleWidthLack();
    }

    if( paraStyle ) {
        para = goog.dom.getParentElement(line);
        page = line.getPage();

        oldps = para.getParagraphStyle();
        para.setParagraphStyle(paraStyle);

        para.handleLineAlign();

        line.handleOverflow();
        line.handleWidthLack();

        page.handleOverflow();
        page.handleWidthLack();
    }

    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);

    if( aHistory ) {
        var redo = new AH_Style(block, blockStyle, line, paraStyle);
        var undo = new AH_Style(block, oldbs, line, oldps);
        G.history.appendAction(undo, redo);
    }
}

Doc.pasteBlocks = function(blockSet) {
    G.rangeSelector.deleteBlocksInRange();

    var target = G.cursor.target;
    var lineC = goog.dom.getParentElement(target.inline);
    var line =  goog.dom.getParentElement(lineC);
    var para = goog.dom.getParentElement(line);
    var cell = goog.dom.getParentElement(para);
    var topPage = cell.getTopPage();

    for( var i = 0; i < blockSet.length; ++i ) {
        var blockOrg = blockSet[i];

        if( blockOrg.className == 'oar-inline-block' ) {
            var block = new InlineBlock();
            block.textContent = blockOrg.textContent;
            block.setBlockStyle(blockOrg.getBlockStyle());

            G.doc.inputCharBefore(block.textContent, block.getBlockStyle(), target, true);
        } else if( blockOrg.className == 'oar-inline-image' ) {
            var block = new InlineImage();
            block.setSource(blockOrg.image.src);

            G.doc.inputImageBefor(block.image.src, block.getSize(), target, true);
        } else if( blockOrg.className == 'oar-inline-eop' ) {
            G.doc.inputEnter(target, true);
        }

        line.handleOverflow();
    }

    if( topPage ) {
        topPage.handleOverflow();
    }

    G.cursor.refreshTarget();
}

Doc.removePage = function(page) {
    var pi = -1;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( this.childrenEle[i] == page ) {
            pi = i;
            break;
        }
    }

    if( pi != -1 ) {
        goog.dom.removeNode(page);
        this.childrenEle.splice(pi, 1);
    }
}

Doc.appendPage = function(page) {
    var lastPage = this.childrenEle[this.childrenEle.length-1];
    if( lastPage ) {
        goog.dom.insertSiblingAfter(page, lastPage);
    } else {
        goog.dom.appendChild(this, page);
    }
    this.childrenEle.push(page);
    this.adjustHeight();
};

Doc.insertPageAfter = function(page, after) {
    var pi = -1;
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        if( this.childrenEle[i] == after ) {
            pi = i;
            break;
        }
    }

    if( pi != -1 ) {
        goog.dom.insertSiblingAfter(page, after);
        this.childrenEle.splice(pi + 1, 0, page);
        this.adjustHeight();
    }
};

Doc.deleteCBefore = function() {
    this.deleteTargetBefore(G.cursor.target, 1, true);
}

Doc.deleteBBefore = function(len) {
    this.deleteTargetBefore(G.cursor.target, len, true);
}

Doc.getPreTarget = function(tg) {
    var preTarget = null;
    var preTargetI = 0;

    var target = tg.inline;
    var targetI = tg.ilh.i;

    if( targetI > 0 ) {
        preTarget = target;
        preTargetI = targetI - 1;
    } else {
        var preBlock = goog.dom.getPreviousElementSibling(target);
        if( preBlock ) {
            preTarget = preBlock;
            preTargetI = preBlock.textContent.length - 1 >= 0 ?preBlock.textContent.length - 1 : 0;
        } else {
            var lineC = goog.dom.getParentElement(target);
            var line = goog.dom.getParentElement(lineC);
            var preLine = goog.dom.getPreviousElementSibling(line);

            if( preLine ) {
                var lastBlock = preLine.childrenEle[preLine.childrenEle.length - 1];
                preTarget = lastBlock;
                preTargetI = lastBlock.textContent.length - 1 >= 0 ?lastBlock.textContent.length - 1 : 0;
            } else {
                var para = goog.dom.getParentElement(line);
                var prePara = goog.dom.getPreviousElementSibling(para);

                if( prePara != null && prePara.className == 'oar-paragraph' ) {
                    var lastLine = prePara.childrenEle[prePara.childrenEle.length - 1];
                    var lastBlock = lastLine.childrenEle[lastLine.childrenEle.length - 1];
                    preTarget = lastBlock;
                    preTargetI = lastBlock.textContent.length - 1 >= 0 ?lastBlock.textContent.length - 1 : 0;
                } else if( prePara != null && prePara.className == 'oar-table' ) {
                    return null;
                } else if( prePara == null ) {
                    var cell = goog.dom.getParentElement(para);
                    var pc = goog.dom.getParentElement(cell);

                    if( pc.className == 'oar-page-editorpane' ) {
                        var page = goog.dom.getParentElement(pc);
                        var prePage = goog.dom.getPreviousElementSibling(page);;

                        if( prePage != null ) {
                            var lastPara = prePage.childrenEle[prePage.childrenEle.length - 1];

                            if( lastPara != null && lastPara.className == 'oar-paragraph' ) {
                                var lastLine = lastPara.childrenEle[lastPara.childrenEle.length - 1];
                                var lastBlock = lastLine.childrenEle[lastLine.childrenEle.length - 1];
                                preTarget = lastBlock;
                                preTargetI = lastBlock.textContent.length - 1 >= 0 ?lastBlock.textContent.length - 1 : 0;
                            }
                            else {
                                return null;
                            }
                        } else {
                            return null;
                        }

                    } else {
                        return null;
                    }
                }
            }
        }
    }

    if( preTarget ) {
        var wh = {};
        if( preTarget.className == 'oar-inline-block' || preTarget.className == 'oar-inline-eop' ) {
            var cf = getComputedFontStyle(preTarget);
            wh = measureFontTextWH( preTarget.textContent.substring(0, preTargetI), cf.family, cf.size, cf.weight);
            wh.h = preTarget.offsetHeight;
        } else if( preTarget.className == 'oar-inline-image' ) {
            wh.w = 0;
            preTargetI = 0;
            wh.h = preTarget.image.offsetHeight;
        }

        return new CursorTarget(preTarget, new ILH(preTargetI, wh.w, wh.h));
    } else {
        return null;
    }
};

Doc.deleteTargetBlock = function(block, aHistory) {
    // old cursor position
    var oldCursorP = getContainerOffset(G.cursor.target.inline);

    if( !aHistory ) {
        G.rangeSelector.clearRangeOverlay();
    }

    var oldBlock = block;
    var oldBlockTL = getContainerOffset(oldBlock);
    var oldType = '';
    var oldC = null;
    var oldSize = null;
    var oldStyle = null;

    var lineC = goog.dom.getParentElement(block);
    var line = goog.dom.getParentElement(lineC);
    var para = goog.dom.getParentElement(line);
    var cell = goog.dom.getParentElement(para);
    var topPage = cell.getTopPage();

    if( block.className == 'oar-inline-block' ) {
        oldType = 'text';
        oldC = block.textContent;
        oldStyle = block.getBlockStyle();
    } else if( block.className == 'oar-inline-image' ) {
        oldType = 'image';
        oldC = block.getSource();
        oldSize = block.getSize();
    } else if( block.className == 'oar-inline-eop' ) {
        oldType = 'eop';
    }

    line.removeBlock(block);

    if( line.childrenEle.length == 0 ) {
        para.removeLine(line);
    }

    if( para.childrenEle.length == 0 || (para.childrenEle[0] && para.childrenEle[0].childrenEle[0] && para.childrenEle[0].childrenEle[0].className == 'oar-inline-eop') ) {
        cell.removePTA(para);
    }

    if( cell.childrenEle.length == 0 ) {
        cell.appendPTA(new Paragraph());
    }

    // after deal
    var newCursorP = G.doc.getTargetFromPosition(oldCursorP.left, oldCursorP.top);
    if( line ) {
        line.handleWidthLack();
        line.handleLineAlign();
    }

    if( topPage ) {
        topPage.handleWidthLack();
    }

    G.cursor.setTarget(newCursorP.inline, newCursorP.ilh);

    // create redo and undo
    if( aHistory ) {
        var reTL = oldBlockTL;
        var unTL = getContainerOffset(G.cursor.target.inline);

        if( oldType == 'text' ) {
            var ahBlock = new InlineBlock();
            ahBlock.textContent = oldC;
            ahBlock.setBlockStyle(oldStyle);

            var undo = new AH_Insert(ahBlock, unTL.left , unTL.top );
            var redo = new AH_Delete(reTL.left, reTL.top, true, false);
            G.history.appendAction(undo, redo);
        } else if( oldType == 'image' ) {
            var ahBlock = new InlineImage();
            ahBlock.tmpSrc = oldC;
            ahBlock.setSize(oldSize.w, oldSize.h);

            var undo = new AH_Insert(ahBlock, unTL.left , unTL.top );
            var redo = new AH_Delete(reTL.left , reTL.top, false, false);
            G.history.appendAction(undo, redo);
        } else if( oldType == 'eop' ) {
            var undo = new AH_Insert(new InlineEOP(), unTL.left , unTL.top );
            var redo = new AH_Delete(reTL.left , reTL.top, true, false);
        }
    }
}

Doc.deleteTargetBefore = function(target, len, aHistory) {
    var oldTarget = target;
    var oldType = '';
    var oldC = null;
    var oldSize = null;
    var oldStyle = null;

    var preTarget = this.getPreTarget(target);

    if( preTarget ) {
        var preLineC = goog.dom.getParentElement(preTarget.inline);
        var preLine = goog.dom.getParentElement(preLineC);

        // delete
        if( preTarget.inline.className == 'oar-inline-block' ) {
            oldType = 'text';
            oldStyle = preTarget.inline.getBlockStyle();

            var text = preTarget.inline.textContent;
            var textL = text.substring(0, preTarget.ilh.i - (len-1));
            var textR = text.substring(preTarget.ilh.i + 1);
            oldC = text.substring(preTarget.ilh.i - (len-1), preTarget.ilh.i + 1);

            preTarget.inline.textContent = textL + textR;

            if( preTarget.inline.textContent.length == 0 ) {
                preLine.removeBlock(preTarget.inline);
            }
        } else if( preTarget.inline.className == 'oar-inline-eop' ) {
            oldType = 'eop';

            preLine.removeBlock(preTarget.inline);
        } else if( preTarget.inline.className == 'oar-inline-image' ) {
            oldType = 'image';
            oldC = preTarget.inline.image.src;
            oldSize = preTarget.inline.getSize();
            preLine.removeBlock(preTarget.inline);
        }

        // handle line width lack
        var csd = preLine.handleWidthLack();

        // handle page width lack
        var prePara = goog.dom.getParentElement(preLine);
        var cell = goog.dom.getParentElement(prePara);
        var pc = goog.dom.getParentElement(cell);

        if( pc.className == 'oar-page-editorpane' ) {
            var prePage = goog.dom.getParentElement(pc);
            prePage.handleWidthLack();
        }

        // adjust cursor position
        if( preTarget.inline == target.inline ) {
            G.cursor.setTarget(preTarget.inline, preTarget.ilh);
        } else if( csd ) {
            G.cursor.setTarget(csd.inline, csd.ilh);
        } else {
            G.cursor.setTarget(target.inline, new ILH(0,0,target.ilh.h));
        }
        G.cursor.refreshTarget();
    }

    // create redo and undo
    if( aHistory ) {
        var reTL = getContainerOffset(oldTarget.inline);
        var unTL = getContainerOffset(G.cursor.target.inline);

        if( oldType == 'text' ) {
            var ahBlock = new InlineBlock();
            ahBlock.textContent = oldC;
            ahBlock.setBlockStyle(oldStyle);

            var undo = new AH_Insert(ahBlock, unTL.left + G.cursor.target.ilh.l , unTL.top );
            var redo = new AH_Delete(reTL.left + oldTarget.ilh.l , reTL.top, len, true);
            G.history.appendAction(undo, redo);
        } else if( oldType == 'image' ) {
            var ahBlock = new InlineImage();
            ahBlock.tmpSrc = oldC;
            ahBlock.setSize(oldSize.w, oldSize.h);

            var undo = new AH_Insert(ahBlock, unTL.left + G.cursor.target.ilh.l , unTL.top );
            var redo = new AH_Delete(reTL.left + oldTarget.ilh.l , reTL.top, false, true);
            G.history.appendAction(undo, redo);
        } else if( oldType == 'eop' ) {
            var undo = new AH_Insert(new InlineEOP(), unTL.left + G.cursor.target.ilh.l , unTL.top );
            var redo = new AH_Delete(reTL.left + oldTarget.ilh.l , reTL.top, true, true);
            G.history.appendAction(undo, redo);
        }
    }
}

Doc.inputCharBefore = function(c, blockStyle, target, aHistory) {
    var ct = target;

    // insert before BLOCK
    if( ct.inline.className == 'oar-inline-block' || ct.inline.className == 'oar-inline-eop' || ct.inline.className == 'oar-inline-image') {
        if( ct.ilh.i == 0 ) {
            // insert position is 0
            var pb = goog.dom.getPreviousElementSibling(ct.inline);
            if( pb && pb.className == 'oar-inline-block' && pb.getBlockStyle().equals(blockStyle) ) {
                // same style as previous block
                pb.textContent = pb.textContent + c;
                G.cursor.setTarget(ct.inline, ct.ilh);
            } else {
                if( ct.inline.className == 'oar-inline-block' && ct.inline.getBlockStyle().equals(blockStyle) ) {
                    // same style as this block
                    ct.inline.textContent = c + ct.inline.textContent;
                    var nILH = ct.ilh;
                    nILH.i += c.length;
                    var nLH = ct.inline.getLHFromI(nILH.i);
                    nILH.l = nLH.l;
                    nILH.h = nLH.h;
                    G.cursor.setTarget(ct.inline, nILH);
                } else {

                    var nBlock = new InlineBlock();
                    nBlock.textContent = c;
                    nBlock.setBlockStyle(blockStyle);
                    var lineC = goog.dom.getParentElement(ct.inline);
                    var line = goog.dom.getParentElement(lineC);
                    line.insertBlockBefore(nBlock, ct.inline);
                    G.cursor.setTarget(ct.inline, ct.ilh);
                }
            }
        } else {
            if( ct.inline.getBlockStyle().equals(blockStyle) ) {
                // same style as this block
                var textL = ct.inline.textContent.substring(0, ct.ilh.i);
                var textR = ct.inline.textContent.substring(ct.ilh.i);
                ct.inline.textContent = textL + c + textR;
                var nILH = ct.ilh;
                nILH.i += c.length;
                var nLH = ct.inline.getLHFromI(nILH.i);
                nILH.l = nLH.l;
                nILH.h = nLH.h;
                G.cursor.setTarget(ct.inline, nILH);

            } else {
                // break this block into two
                var textL = ct.inline.textContent.substring(0, ct.ilh.i);
                var textR = ct.inline.textContent.substring(ct.ilh.i);

                var blockR = new InlineBlock();
                blockR.textContent = textR;
                blockR.setBlockStyle(ct.inline.getBlockStyle());

                var nBlock = new InlineBlock();
                nBlock.textContent = c;
                nBlock.setBlockStyle(blockStyle);

                ct.inline.textContent = textL;

                var lineC = goog.dom.getParentElement(ct.inline);
                var line = goog.dom.getParentElement(lineC);
                line.insertBlockAfter(blockR, ct.inline);
                line.insertBlockAfter(nBlock, ct.inline);

                var nILH = ct.ilh;
                nILH.i = 0;
                var nLH = blockR.getLHFromI(nILH.i);
                nILH.l = nLH.l;
                nILH.h = nLH.h;
                G.cursor.setTarget(blockR, nILH);
            }
        }
    }
    var lineC  = goog.dom.getParentElement(ct.inline);
    var line  = goog.dom.getParentElement(lineC);

    // handle line align
    line.handleLineAlign();

    // deal width line overflow
    line.handleOverflow();

    // handle page overflow
    var page = line.getPage();
    page.handleOverflow();

    // check cursor overflow
    if( G.cursor.target.inline &&
        G.cursor.target.inline instanceof HTMLElement &&
        goog.dom.getParentElement(G.cursor.target.inline) != null &&
        G.cursor.target.ilh.i < G.cursor.target.inline.textContent.length ) {
        // passive overflow
        G.cursor.setTarget(G.cursor.target.inline, G.cursor.target.ilh);
    } else {
        // self overflow
        var nextL = goog.dom.getNextElementSibling(line);
        if( nextL ) {
            var newT = nextL.childrenEle[0];
            G.cursor.setTarget(newT, new ILH(0, 0, newT.offsetHeight));
        }
    }

    // create redo and undo
    if( aHistory == true ) {
        var reTL = getContainerOffset(target.inline);
        var unTL = getContainerOffset(G.cursor.target.inline);

        var ahBlock = new InlineBlock();
        ahBlock.textContent = c;
        ahBlock.setBlockStyle(blockStyle);

        var redo = new AH_Insert(ahBlock, reTL.left + target.ilh.l , reTL.top );
        var undo = new AH_Delete(unTL.left + G.cursor.target.ilh.l , unTL.top, c.length, true);

        G.history.appendAction(undo, redo);
    }
}

Doc.loadFromString = function(xmlStr) {
    var docX = (new window.DOMParser).parseFromString(xmlStr, "text/xml");

    var doc = docX.documentElement;
    var titlebar = goog.dom.getElement('oar-titlebar');
    titlebar.textContent = doc.getAttribute('name');

    sendNewFileName(doc.getAttribute('name'));

    G.doc.renew();
    var page = this.childrenEle[this.childrenEle.length - 1];
    page.removePTA(page.childrenEle[page.childrenEle.length - 1]);

    if( page.className == 'oar-page' ) {
        loadFromNode(page, doc);
    }

    page = this.childrenEle[0];
    var line = page.childrenEle[0].childrenEle[0];
    G.cursor.setTarget(line.childrenEle[0], new ILH(0,0,line.childrenEle[0].offsetHeight));
};

Doc.renew = function() {
    // remove page
    for( var i = 0; i < this.childrenEle.length; ++i ) {
        var child = this.childrenEle[i];
        if(child .className ) {
            if( child.className == 'oar-page' ) {
                this.removePage(child);
                --i;
            }
        }
    }

    var page = new Page();
    this.appendPage(page);

    // remove image resizer
    if( G.iamgeResizer ) {
        goog.dom.removeNode(G.iamgeResizer);
        G.iamgeResizer = null;
    }

    // reset cursor
    var line = page.cell.childrenEle[0].childrenEle[0];
    G.cursor.setTarget(line.childrenEle[0], new ILH(0,0,line.childrenEle[0].offsetHeight));
    G.inputbox.focus();
}

Doc.inputImageBefor = function(src, size, tg, aHistory) {
    var image = new InlineImage();
    image.setSource(src);

    var target = tg.inline;
    var targetI = tg.ilh.i;
    var lineC = goog.dom.getParentElement(target);
    var line = goog.dom.getParentElement(lineC);

    if(targetI == 0) {
        if( line ) {
            line.insertBlockBefore(image, target);
        }
    } else {
        var targetR = new InlineBlock();
        targetR.setBlockStyle(target.getBlockStyle());
        targetR.textContent = target.textContent.substring(targetI);
        target.textContent = target.textContent.substring(0, targetI);

        line.insertBlockAfter(targetR, target);
        line.insertBlockAfter(image, target);
    }

    // create redo and undo
    if( aHistory ) {
        var reTL = getContainerOffset(tg.inline);
        var unTL = getContainerOffset(G.cursor.target.inline);

        var newImageBlock = new InlineImage();
        newImageBlock.tmpSrc = src;
        if( size ) {
            newImageBlock.setSize(size.w, size.h);
        }

        var redo = new AH_Insert(newImageBlock, reTL.left + tg.ilh.l , reTL.top );
        var undo = new AH_Delete(unTL.left + G.cursor.target.ilh.l , unTL.top, false, true);
        G.history.appendAction(undo, redo);
    }

}

//---------------------------------------------------------------------------------------------------------------------- history action
// actions

var AH_Insert = function(blk, x0, y0) {
    this.type = 'insert';
    this.info = {block: blk, x:x0, y:y0 };
}

AH_Insert.prototype.act = function() {
    var target = G.doc.getTargetFromPosition(this.info.x, this.info.y);
    if( this.info.block.className == 'oar-inline-block' ) {
        G.doc.inputCharBefore(this.info.block.textContent, this.info.block.getBlockStyle(), target, false);
    } else if( this.info.block.className == 'oar-inline-image' ) {
        G.doc.inputImageBefor(this.info.block.tmpSrc, this.info.block.getSize(), target, false);
    } else if( this.info.block.className == 'oar-inline-eop' ) {
        G.doc.inputEnter(target, false);
    }
}

var AH_Delete = function(x0, y0, l, bef) {
    this.type = 'delete';
    this.info = {x:x0, y:y0, len:l, before: bef  };
}

AH_Delete.prototype.act = function() {
    var target = G.doc.getTargetFromPosition(this.info.x, this.info.y);

    if( this.info.before ) {
        G.doc.deleteTargetBefore(target, this.info.len, false);
    } else {
        G.doc.deleteTargetBlock(target.inline, false);
    }

}

var AH_Style = function(blk, bs, li, ps) {
    this.type = 'style';
    this.info = { block:blk, blockStyle:bs, line:li, paraStyle:ps };
}

AH_Style.prototype.act = function() {
    if( this.info.blockStyle ) {
        G.doc.changeStyle(this.info.block, this.info.blockStyle, this.info.line, this.info.paraStyle, false);
    }

    if( this.info.paraStyle ) {
        G.doc.changeStyle(this.info.block, this.info.blockStyle, this.info.line, this.info.paraStyle, false);
    }

}

//---------------------------------------------------------------------------------------------------------------------- history
var ActionHistory = function() {
    this.undoAction = [];
    this.redoAction = [];
    this.timestamp = [];

    this.cp = -1;
}

ActionHistory.prototype.appendAction = function(undo, redo) {
    // clear above cp
    this.undoAction.splice(this.cp + 1);
    this.redoAction.splice(this.cp + 1);
    this.timestamp.splice(this.cp + 1);

    // append action
    this.undoAction.push(undo);
    this.redoAction.push(redo);
    this.timestamp.push(Math.round(+new Date()/1000)); // seconds since the epoch

    this.cp++;
}

ActionHistory.prototype.undo = function() {

    var action = this.undoAction[this.cp];
    if( action ) {
        action.act();
        this.cp--;
    }
}

ActionHistory.prototype.redo = function() {
    var action = this.redoAction[this.cp + 1];
    if( action ) {
        action.act();
        this.cp++;
    }
}

