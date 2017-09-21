package com.airxiechao.oarword;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.Enumeration;
import java.util.Iterator;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.bind.JAXBElement;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.fileupload.util.Streams;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.docx4j.Docx4jProperties;
import org.docx4j.dml.wordprocessingDrawing.Inline;
import org.docx4j.jaxb.Context;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.BinaryPartAbstractImage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.docx4j.utils.Log4jConfigurator;
import org.docx4j.wml.BooleanDefaultTrue;
import org.docx4j.wml.CTBorder;
import org.docx4j.wml.CTHeight;
import org.docx4j.wml.Drawing;
import org.docx4j.wml.HpsMeasure;
import org.docx4j.wml.Jc;
import org.docx4j.wml.JcEnumeration;
import org.docx4j.wml.ObjectFactory;
import org.docx4j.wml.P;
import org.docx4j.wml.PPr;
import org.docx4j.wml.R;
import org.docx4j.wml.RPr;
import org.docx4j.wml.STBorder;
import org.docx4j.wml.Tbl;
import org.docx4j.wml.TblBorders;
import org.docx4j.wml.TblGrid;
import org.docx4j.wml.TblGridCol;
import org.docx4j.wml.TblPr;
import org.docx4j.wml.TblWidth;
import org.docx4j.wml.Tc;
import org.docx4j.wml.TcPr;
import org.docx4j.wml.Text;
import org.docx4j.wml.Tr;
import org.docx4j.wml.TrPr;
import org.docx4j.wml.UnderlineEnumeration;
import org.docx4j.wml.PPrBase.Spacing;
import org.docx4j.wml.TcPrInner.GridSpan;
import org.docx4j.wml.TcPrInner.VMerge;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;

/**
 * Servlet implementation class Download
 */
public class Download extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private String sessionId = "0";
	private String servletPath;
	private static final int BUFSIZE = 4096;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Download() {
        super();
        
		Docx4jProperties.getProperties().setProperty("docx4j.Log4j.Configurator.disabled", "true");
		Log4jConfigurator.configure();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		sessionId = request.getSession().getId();
		servletPath = getServletContext().getRealPath("/");
		String filePara = request.getParameter("file");

		try {
			String filePath = servletPath + filePara;
	        File file = new File(filePath);
	        
	        if( !file.exists() ) {
	        	throw new Exception();
	        }
	        
	        int length = 0;
	        ServletOutputStream outStream = response.getOutputStream();
	        ServletContext context  = getServletConfig().getServletContext();
	        String mimetype = context.getMimeType(filePath);
	        
	        // sets response content type
	        if (mimetype == null) {
	            mimetype = "application/octet-stream";
	        }
	        response.setContentType(mimetype);
	        response.setContentLength((int)file.length());
	        String fileName = file.getName();

	        // sets HTTP header
	        response.setHeader("Content-Disposition", "attachment; filename=\"" + URLEncoder.encode(fileName, "UTF-8") + "\"");
	        
	        byte[] byteBuffer = new byte[BUFSIZE];
	        DataInputStream in = new DataInputStream(new FileInputStream(file));
	        
	        // reads the file's bytes and writes them to the response stream
	        while ((in != null) && ((length = in.read(byteBuffer)) != -1))
	        {
	            outStream.write(byteBuffer,0,length);
	        }
	        
	        in.close();
	        outStream.close();
			
		} catch(Exception e) {
			response.sendError(404);	
		}
	
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		sessionId = request.getSession().getId();
		servletPath = getServletContext().getRealPath("/");
		
		try {
			String type = null;
			String name = null;
			String xml = null;
			
			ServletFileUpload upload = new ServletFileUpload();
			FileItemIterator iter = upload.getItemIterator(request);
			
			while (iter.hasNext()) {
			    FileItemStream item = iter.next();
			    String itemName = item.getFieldName();
			    InputStream stream = item.openStream();
			    
			    if (item.isFormField()) {
			    	
			    	if( itemName.equals("type") ) {
			    		type = Streams.asString(stream);
			    	} else if( itemName.equals("name") ) {
			    		name = Streams.asString(stream);
			    	} else if( itemName.equals("xml") ) {
			    		xml = Streams.asString(stream);
			    	}
			    }
			}
			
			//System.out.println(type);
			//System.out.println(name);
			//System.out.println(xml);
			
			if( type == null ) {
				type = "docx";
			}
			
			if( type == null || name == null || xml == null ) {
				throw new Exception();
			}
			
			// create file
			WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.createPackage();
			MainDocumentPart wordDocumentPart = wordMLPackage.getMainDocumentPart();
			ObjectFactory factory = Context.getWmlObjectFactory(); 
			
			// doc xml
	        Document doc = DocumentHelper.parseText(xml);
	        Element root = doc.getRootElement();       
	        
	        addElementToDocx(root, null, wordDocumentPart, factory, wordMLPackage);
	        
	        String fileDirStr = "tmp/" + sessionId + (System.currentTimeMillis() / 1000L) + "DIR";
	        File fileDir = new File(servletPath + fileDirStr);
	        if( !fileDir.exists() ) {
	        	fileDir.mkdir();
	        }
	        
	        String fileName = fileDirStr + "/" + name + "." + "docx";
	        File file = new File(servletPath + fileName);
	        System.out.println(file.getAbsolutePath());
	        wordMLPackage.save(file);
	        
	        // docx to doc or pdf
	        if( type.equals("doc") ) {
	        	String docFileName = fileDirStr + "/" + name + "." + "doc";
	        	FileConverter.convert(servletPath + fileName, servletPath + docFileName);
	        	fileName = docFileName;
	        } else if( type.equals("pdf") ) {
	        	String pdfFileName = fileDirStr + "/" + name + "." + "pdf";
	        	FileConverter.convert(servletPath + fileName, servletPath + pdfFileName);
	        	fileName = pdfFileName;
	        }
			
	        response.setCharacterEncoding("UTF-8");
			response.getWriter().print(fileName);

			
		} catch(Exception e) {
			e.printStackTrace();
			response.getWriter().print("error");
		}
	}

	protected void addElementToDocx(Element root, Tc tc, MainDocumentPart wordDocumentPart, 
			ObjectFactory factory, WordprocessingMLPackage wordMLPackage) 
		throws Exception{
		try {
			// iterate paragraph or table
	        for ( Iterator i = root.elementIterator(); i.hasNext(); ) {
	            Element pt = (Element) i.next();

	            if( pt.getName().equals("paragraph") ) {
	            	
	            	P p = factory.createP();
	            	if( tc == null ) {
	            		wordDocumentPart.addObject(p);	
	            	} else {
	            		tc.getContent().add(p);
	            	}     	
	            	
	            	// set paragraph align
	            	String alignStr = pt.attributeValue("align");
	        	    PPr pPr = factory.createPPr();
	        	    
	        	    // set space
	        	    Spacing space = new Spacing();
	        	    space.setAfter(BigInteger.ZERO);
	        	    space.setBefore(BigInteger.ZERO);
	        	    pPr.setSpacing(space);
	        	    
	        	    Jc jc = factory.createJc();
	        	    if( alignStr.equals("right") ) {
	        	    	jc.setVal(JcEnumeration.RIGHT);	
	        	    } else if( alignStr.equals("center") ) {
	        	    	jc.setVal(JcEnumeration.CENTER);	
	        	    }
	        	    
	        	    pPr.setJc(jc);
	        	    
	        	    p.setPPr(pPr);
	            	
	            	for( Iterator bi = pt.elementIterator(); bi.hasNext();  ) {
	            		Element inline = (Element) bi.next();
	            		
	            		if( inline.getName().equals("text") ) {
	            			Element contentEle = inline.element("content");
	            			String content = contentEle.getText();
	            			
	            			Element styleEle = inline.element("style");
	            			String fontSize = styleEle.attributeValue("font-size");
	            			String fontFamily = styleEle.attributeValue("font-family");
	            			String fontWeight = styleEle.attributeValue("font-weight");
	            			String fontStyle = styleEle.attributeValue("font-style");
	            			String color = styleEle.attributeValue("color");
	            			String backgroundColor = styleEle.attributeValue("background-color");
	            			String textDecoration = styleEle.attributeValue("text-decoration");
	            			String script = styleEle.attributeValue("script");

	            			R r = factory.createR();
	            			RPr rpr = new RPr();
	            			
	            			// content
	            			Text t = factory.createText();
	            			t.setValue(content);

	            			// font size
	            			if( script.equals("normal") ) {
		            			HpsMeasure size = new HpsMeasure();  
		            	        size.setVal(BigInteger.valueOf(Long.parseLong(fontSize) * 11 / 14 * 2));
		            	        rpr.setSz(size);
	            			}
	            	        
	            	        // font family
	            	        org.docx4j.wml.RFonts font = factory.createRFonts();
	            	        font.setAscii(fontFamily);
	            	        font.setEastAsia(fontFamily);
	            	        rpr.setRFonts(font);
	            	        
	            	        // color
	            	        org.docx4j.wml.Color colorX = factory.createColor();
	            	        color = RGB2Hex(color);
	            	        colorX.setVal(color);
	            	        rpr.setColor(colorX);
	            	        
	            	        // background color
	            	        if( !backgroundColor.equals("transparent") ) {
	            	        	backgroundColor = RGB2Hex(backgroundColor);
	            	        	org.docx4j.wml.CTShd sd = factory.createCTShd();
	            	        	sd.setFill(backgroundColor);
	                            rpr.setShd(sd); 
	            	        }
	            	        
	            	        // bold
	            	        if( fontWeight.equals("bold") ) {
	            	        	rpr.setB(new BooleanDefaultTrue());
	            	        }
	            	        
	            	        // italic
	            	        if( fontStyle.equals("italic") ) {
	            	        	rpr.setI(new BooleanDefaultTrue());
	            	        }
	            	        
	            	        // text decoration
	            	        if( textDecoration.equals("underline") ) {
	            	        	org.docx4j.wml.U u = factory.createU();
	            	        	u.setColor(color);
	            	        	u.setVal(UnderlineEnumeration.SINGLE);
	            	        	rpr.setU(u);
	            	        }
	            	        
	            	        // script
	            	        if( script.equals("superscript") ) {
	            	        	org.docx4j.wml.CTVerticalAlignRun vr = factory.createCTVerticalAlignRun();
	            	        	vr.setVal(org.docx4j.wml.STVerticalAlignRun.SUPERSCRIPT);
	            	        	rpr.setVertAlign(vr);
	            	        } else if( script.equals("subscript") ) {
	            	        	org.docx4j.wml.CTVerticalAlignRun vr = factory.createCTVerticalAlignRun();
	            	        	vr.setVal(org.docx4j.wml.STVerticalAlignRun.SUBSCRIPT);
	            	        	rpr.setVertAlign(vr);
	            	        }
	            	        
	            	        r.setRPr(rpr); 
	            			r.getContent().add(t);
	            			
	            			// add text
	            			p.getContent().add(r);	
	            		} else if( inline.getName().equals("drawing") ) {
	            			String imgSrc = inline.element("content").getText();
	            			String imgWidth = inline.element("style").attributeValue("width");
	            			String imgHeight = inline.element("style").attributeValue("height");

	            			HttpClient httpclient = new DefaultHttpClient();
	            			HttpGet httpget = new HttpGet(imgSrc);
	            			 
	            			HttpResponse response = httpclient.execute(httpget);
	            			HttpEntity entity = response.getEntity();
	            			int connCode = response.getStatusLine().getStatusCode();
	            			
	            	        if( connCode != 200 || entity == null ) {
	            	        	continue;
	            	        }

	            	        File file = new File(servletPath + "tmp/" + sessionId + (System.currentTimeMillis() / 1000L) + ".jpg");
            				FileOutputStream fos = new FileOutputStream(file);
            			    entity.writeTo(fos);
            			    fos.close();	
	            			
	            			byte[] bytes = convertImageToByteArray(file);
	            			BinaryPartAbstractImage imagePart = BinaryPartAbstractImage.createImagePart(wordMLPackage, bytes);
	            	        
	            	        int id1 = 1;
	            	        int id2 = 2;
	            	        Inline imageInline = imagePart.createImageInline("","", 
	            	        		id1, id2, Long.parseLong(imgWidth) * 9525, Long.parseLong(imgHeight) * 9525, false);
	            	        /*
	            	        ImageSize iamgeSize = imagePart.getImageInfo().getSize();
	            	        iamgeSize.setSizeInPixels(Integer.parseInt(imgWidth), Integer.parseInt(imgHeight));
	            	        */
	            	 
	            	        R r = factory.createR();
	            	        Drawing drawing = factory.createDrawing();
	            	        drawing.getAnchorOrInline().add(imageInline);
	            	        r.getContent().add(drawing);
	            	        
	            	        // add image
	            			p.getContent().add(r);	
	            		}
	            	}
	            } else if( pt.getName().equals("table") ) {
	            	Tbl table = factory.createTbl();
	            	if( tc == null ) {
		            	wordDocumentPart.addObject(table);
	            	} else {
	            		tc.getContent().add(table);
	            	}
	            	
	            	// add border
	            	table.setTblPr(new TblPr());
	                CTBorder border = new CTBorder();
	                border.setColor("auto");
	                border.setSz(new BigInteger("4"));
	                border.setSpace(new BigInteger("0"));
	                border.setVal(STBorder.SINGLE);
	         
	                TblBorders borders = new TblBorders();
	                borders.setBottom(border);
	                borders.setLeft(border);
	                borders.setRight(border);
	                borders.setTop(border);
	                borders.setInsideH(border);
	                borders.setInsideV(border);
	                table.getTblPr().setTblBorders(borders);
	            	
	                // add row and column
	                Element maxColsRow = null;
	                int maxNumCols = 0;
	            	for( Iterator ri = pt.elementIterator(); ri.hasNext();  ) {
	            		Element row = (Element) ri.next();
	            		
	            		Tr tableRow = factory.createTr();
	            		table.getContent().add(tableRow);
	            		
	            		// set row height
	            		String rowHeightStr = row.attributeValue("height");
	            		CTHeight ctHeight = factory.createCTHeight();
	            		//ctHeight.setHRule(STHeightRule.EXACT);
	            		ctHeight.setVal(BigInteger.valueOf(Integer.parseInt(rowHeightStr) / 14 * 11 * 20));
	            		JAXBElement<CTHeight> jaxbElement = factory.createCTTrPrBaseTrHeight(ctHeight);
	            		
	            		TrPr trPr = factory.createTrPr();
	            		trPr.getCnfStyleOrDivIdOrGridBefore().add(jaxbElement);
	            		tableRow.setTrPr(trPr);
	            		
	            		int numCols = 0;
	            		for( Iterator ci = row.elementIterator(); ci.hasNext(); ) {
	            			Element col = (Element) ci.next();
	            			++numCols;
	            			
	            			Tc tableCell = factory.createTc();
	            			tableRow.getContent().add(tableCell);
	            			
	            			String colWidth = col.attributeValue("width");
	            			String colSpanStr = col.attributeValue("colspan");
	            			String rowSpanStr = col.attributeValue("rowspan");
	            			int colspan = Integer.parseInt(colSpanStr);
	            			int rowspan = Integer.parseInt(rowSpanStr);
	            			
	            			// set cell width
	            			TcPr tcPr = new TcPr();
	            	        TblWidth tableWidth = new TblWidth();
	            	        tableWidth.setType("dxa");
	            	        tableWidth.setW(BigInteger.valueOf(Integer.parseInt(colWidth) / 14 * 11 * 20)); // twips
	            	        tcPr.setTcW(tableWidth);
	            	        tableCell.setTcPr(tcPr);
	            	        
	            	        // set merge
	            	        if( colspan > 1 ) {
	            	        	 GridSpan gridSpan = factory.createTcPrInnerGridSpan();
	            	             gridSpan.setVal(BigInteger.valueOf(colspan));
	            	             tcPr.setGridSpan(gridSpan);	
	            	        }
	            	        
	            	        if( rowspan > 1 ) {
	            	        	VMerge vm = new VMerge();
	            	        	vm.setVal("restart");
	            	        	tcPr.setVMerge(vm);
	            	        } else if( rowspan == 0 ) {
	            	        	VMerge vm = new VMerge();
	            	        	vm.setVal("continue");
	            	        	tcPr.setVMerge(vm);
	            	        }
	            	        
	            	        // set cell content
	            			addElementToDocx(col, tableCell, wordDocumentPart, factory, wordMLPackage);
	            		}
	            		if( maxNumCols < numCols ) {
	            			maxNumCols = numCols;
	            			maxColsRow = row;
	            		}
	            	}
	            	
	            	// set table grid
	            	TblGrid tblGrid = factory.createTblGrid();
	            	
	            	for( Iterator ci = maxColsRow.elementIterator(); ci.hasNext(); ) {
	        			Element col = (Element) ci.next();
	        			
	        			String colWidth = col.attributeValue("width");
	        			
	        			TblGridCol tblGridCol = factory.createTblGridCol();
	    				tblGridCol.setW(BigInteger.valueOf(Integer.parseInt(colWidth) / 14 * 11 * 20));
	    				tblGrid.getGridCol().add(tblGridCol);
	            	}
	            	table.setTblGrid(tblGrid);
	            }
	        }
			
		} catch(Exception e) {
			e.printStackTrace();
			throw new Exception();
		}	
	}
	
	// color RGB to Hex
    private static String RGB2Hex(String color) {
    	try {
    		String colorR = color.substring(4, color.indexOf(","));
    		String colorG = color.substring(color.indexOf(",") + 2, color.lastIndexOf(","));
    		String colorB = color.substring(color.lastIndexOf(",") + 2, color.lastIndexOf(")"));
    		
    		String colorRHex = Integer.toHexString(0x100 | Integer.parseInt(colorR)).substring(1);
    		String colorGHex = Integer.toHexString(0x100 | Integer.parseInt(colorG)).substring(1);
    		String colorBHex = Integer.toHexString(0x100 | Integer.parseInt(colorB)).substring(1);
    		
    		color = colorRHex + colorGHex + colorBHex;
    		color = color.toUpperCase();
    		return color;
    	} catch( Exception e ) {
    		return "ffffff";
    	}
    }
    
    // convert image to ByteArray
    private static byte[] convertImageToByteArray(File file) throws FileNotFoundException, IOException {
        InputStream is = new FileInputStream(file );
        long length = file.length();

        if (length > Integer.MAX_VALUE) {
            System.out.println("File too large!!");
        }
        byte[] bytes = new byte[(int)length];
        int offset = 0;
        int numRead = 0;
        while (offset < bytes.length && (numRead=is.read(bytes, offset, bytes.length-offset)) >= 0) {
            offset += numRead;
        }

        if (offset < bytes.length) {
            System.out.println("Could not completely read file " +file.getName());
        }
        is.close();
        return bytes;
    }


}
