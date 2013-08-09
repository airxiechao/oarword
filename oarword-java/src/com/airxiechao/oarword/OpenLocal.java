package com.airxiechao.oarword;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import javax.xml.bind.JAXBElement;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.docx4j.Docx4jProperties;
import org.docx4j.dml.CTPositiveSize2D;
import org.docx4j.dml.Graphic;
import org.docx4j.dml.wordprocessingDrawing.Anchor;
import org.docx4j.dml.wordprocessingDrawing.Inline;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.BinaryPartAbstractImage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.docx4j.utils.Log4jConfigurator;
import org.docx4j.wml.BooleanDefaultTrue;
import org.docx4j.wml.CTHeight;
import org.docx4j.wml.Drawing;
import org.docx4j.wml.HpsMeasure;
import org.docx4j.wml.Jc;
import org.docx4j.wml.JcEnumeration;
import org.docx4j.wml.P;
import org.docx4j.wml.PPr;
import org.docx4j.wml.R;
import org.docx4j.wml.RPr;
import org.docx4j.wml.Tbl;
import org.docx4j.wml.TblWidth;
import org.docx4j.wml.Tc;
import org.docx4j.wml.TcPr;
import org.docx4j.wml.Text;
import org.docx4j.wml.TrPr;
import org.docx4j.wml.UnderlineEnumeration;
import org.docx4j.wml.TcPrInner.GridSpan;
import org.docx4j.wml.TcPrInner.VMerge;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;

/**
 * Servlet implementation class OpenLocal
 */
public class OpenLocal extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	private int maxFileSize = 5 * 1024 * 1025;
	private int maxMemSize = 500 * 1024;
	private String sessionId = "0";
	private String servletPath;

    /**
     * Default constructor. 
     */
    public OpenLocal() {
    	super();
    	
		Docx4jProperties.getProperties().setProperty("docx4j.Log4j.Configurator.disabled", "true");
		Log4jConfigurator.configure();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		//response.setContentType("text/html; charset=utf-8");
		response.setCharacterEncoding("UTF-8");
		response.getWriter().print("你好");
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		sessionId = request.getSession().getId();
		servletPath = getServletContext().getRealPath("/");
		File file = null;
		
		try{ 
			if( !ServletFileUpload.isMultipartContent(request) ){
				throw new Exception();
			}
			
			DiskFileItemFactory factory = new DiskFileItemFactory();
			factory.setSizeThreshold(maxMemSize); //maximum size that will be stored in memory
			factory.setRepository(new File(servletPath + "tmp")); //Location to save data that is larger than maxMemSize.
			String filePath = servletPath + "upload"; //getServletContext().getInitParameter("file-upload");

			ServletFileUpload upload = new ServletFileUpload(factory);
			upload.setSizeMax( maxFileSize ); //maximum file size to be uploaded.
			
			List fileItems = upload.parseRequest(request);
			Iterator i = fileItems.iterator();

			String uploadFileName = "";
			if ( i.hasNext () ) 
			{
				FileItem fi = (FileItem)i.next();

				if ( !fi.isFormField () )	
				{
					String fileName = fi.getName();
		            String fieldName = fi.getFieldName();
		            String contentType = fi.getContentType();
		            boolean isInMemory = fi.isInMemory();
		            long sizeInBytes = fi.getSize();
		            
		            if( fileName.lastIndexOf("\\") >= 0 ) {
	            		uploadFileName = fileName.substring(fileName.lastIndexOf("\\" + 1));
		            } else {
		            	uploadFileName = fileName;
		            }
		            
		            file = new File( filePath + "/" + uploadFileName ) ;
		            
		            fi.write(file) ;
		            
		            System.out.println("Uploaded Filename: " + file.getAbsolutePath());
				}
	      	}
			
			if( file != null ) {
				String fileExt = uploadFileName.substring(uploadFileName.lastIndexOf(".") + 1);
				if( fileExt.equals("doc") ) {
					String docxFilePath = filePath + "/" +uploadFileName.substring(0, uploadFileName.lastIndexOf(".")) + ".docx";
					FileConverter.convert(file.getAbsolutePath(), docxFilePath);
					file = new File(docxFilePath);
				}
				
	    		Document xmlDoc = DocumentHelper.createDocument();
	    		Element root = xmlDoc.addElement( "doc" );
	    		root.addAttribute("name", uploadFileName.substring(0, uploadFileName.lastIndexOf(".")));
	    		
	    		WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(file);
	    		MainDocumentPart wordDocumentPart = wordMLPackage.getMainDocumentPart();
	    		
	    		addContentToElement(root, null, wordDocumentPart, wordMLPackage);
	    		
	    		//System.out.println(xmlDoc.asXML());
	    		response.setCharacterEncoding("UTF-8");
	    		response.getWriter().print(xmlDoc.asXML());
	    		
			}
			
	   	}catch(Exception e) {
	   		e.printStackTrace();
	   		response.getWriter().print("error");
	   	}

	}
	
	// docx -> xml
	private void addContentToElement(Element root, Tc tc, MainDocumentPart wordDocumentPart, WordprocessingMLPackage wordMLPackage ) {
    	try {
    		List children;
    		
    		if( tc != null ) {
    			children = tc.getContent();
    		} else {
        		children = wordDocumentPart.getContent();
    		}

    		for( Object pt : children ) {
    			String ptClassName = pt.getClass().getName();

    			if( ptClassName.equals("org.docx4j.wml.P") ) {
    				P p = (P)pt;//(P)((JAXBElement)pt).getValue();
    				Element pEle = root.addElement("paragraph");
    				
    				PPr pPr = p.getPPr();
    				Jc pJc = pPr.getJc();
    				
    				if( pJc != null && pJc.getVal() != null ) {
    					if( pJc.getVal().equals(JcEnumeration.CENTER) ) {
    						pEle.addAttribute("align", "center");	
    					} else if( pJc.getVal().equals(JcEnumeration.RIGHT) ) {
    						pEle.addAttribute("align", "right");		
    					} else {
    						pEle.addAttribute("align", "left");		
    					}
    				}
    				
    				List pContent = p.getContent();
    				for( Object bdr : pContent ) {
    					String bdClassName = bdr.getClass().getName();
    					
    					if( bdClassName.equals("org.docx4j.wml.R") ) {
    						R r = (R)bdr;
    						
    						List rContent = r.getContent();
    						for( Object tedr : rContent ) {
    							String tedrClassName = ((JAXBElement)tedr).getDeclaredType().getName();

    							if( tedrClassName.equals("org.docx4j.wml.Text") ) {
    								Text text = (Text)((JAXBElement)tedr).getValue();
    								String textContent = text.getValue();
    								
    								// text content
    								Element textEle = pEle.addElement("text");
    								Element textContentEle = textEle.addElement("content");
    								textContentEle.addText(textContent);
    								
    								// text style
    								RPr rPr = r.getRPr();
    								Element textStyleEle = textEle.addElement("style");
    								
    								// font size
    								HpsMeasure size = rPr.getSz();
    								if( size != null ) {
    									textStyleEle.addAttribute("font-size", Integer.parseInt(size.getVal().toString()) * 14 / 2 / 11  + "");	
    								} else {
    									textStyleEle.addAttribute("font-size", 14 + "");	
    								}
    								
    								
    								// font family
    								org.docx4j.wml.RFonts font = rPr.getRFonts();
    								if( font != null ) {
        								textStyleEle.addAttribute("font-family", font.getEastAsia());					
    								}

    			            	    
    								// color
    		            	        org.docx4j.wml.Color color = rPr.getColor();
    		            	        if( color != null ) {
        		            	        textStyleEle.addAttribute("color", "#" + color.getVal());	
    		            	        }
    		            	        
    		            	        // background color
    	            	        	org.docx4j.wml.CTShd sd = rPr.getShd();
    	            	        	if( sd != null ) {
    	            	        		textStyleEle.addAttribute("color", "#" + sd.getFill());
    	            	        	}
    	            	        	
    	            	        	// bold
    	            	        	if( rPr.getB() != null ) {
    	            	        		textStyleEle.addAttribute("font-weight", "bold");		
    	            	        	} else {
    	            	        		textStyleEle.addAttribute("font-weight", "normal");		
    	            	        	}
    	            	        	
    	            	        	// italic
    	            	        	if( rPr.getI() != null ) {
    	            	        		textStyleEle.addAttribute("font-style", "italic");		
    	            	        	} else {
    	            	        		textStyleEle.addAttribute("font-style", "normal");		
    	            	        	}
    	            	        	
    	            	        	// underline
    	            	        	org.docx4j.wml.U u = rPr.getU();
    	            	        	if( u != null && u.getVal().equals(UnderlineEnumeration.SINGLE) ) {
    	            	        		textStyleEle.addAttribute("text-decoration", "underline");	
    	            	        	} else {
    	            	        		textStyleEle.addAttribute("text-decoration", "none");		
    	            	        	}
    	            	        	
    	            	        	// script
    	            	        	org.docx4j.wml.CTVerticalAlignRun vr = rPr.getVertAlign();
    	            	        	if( vr != null && vr.equals(org.docx4j.wml.STVerticalAlignRun.SUPERSCRIPT) ) {
    	            	        		textStyleEle.addAttribute("script", "superscript");	
    	            	        	} else if( vr != null && vr.equals(org.docx4j.wml.STVerticalAlignRun.SUBSCRIPT) ) {
    	            	        		textStyleEle.addAttribute("script", "subscript");		
    	            	        	} else {
    	            	        		textStyleEle.addAttribute("script", "normal");	
    	            	        	}

    							} else if( tedrClassName.equals("org.docx4j.wml.Drawing") ) {
    								Drawing drawing = (Drawing)((JAXBElement)tedr).getValue();	
    								
    								Element drawingEle = pEle.addElement("drawing");
    								Element drawingContentEle = drawingEle.addElement("content");
    								
    								
    								Element drawingStyleEle = drawingEle.addElement("style");
    								
    								List drawingInline = drawing.getAnchorOrInline();
    								for( Object dInline : drawingInline ) {
    									boolean bia = false;
    									CTPositiveSize2D inlineEx = null;
    									Graphic graphic = null;
    									
    									if( dInline instanceof org.docx4j.dml.wordprocessingDrawing.Inline ) {
    										Inline inline = (Inline)dInline;
    										inlineEx = inline.getExtent();
    										graphic = inline.getGraphic();
    										bia = true;
    									} else if( dInline instanceof org.docx4j.dml.wordprocessingDrawing.Anchor ) {
    										Anchor anchor = (Anchor)dInline;
    										inlineEx= anchor.getExtent();
    										graphic = anchor.getGraphic();
    										bia = true;
    									}
    									
    									if( bia ) {
    										String emb = graphic.getGraphicData().getPic().getBlipFill().getBlip().getEmbed();
    										String embName = wordDocumentPart.getRelationshipsPart().getPart(emb).getPartName().getName();
    										String embExt = embName.substring(embName.lastIndexOf("."));
    										String imgName = sessionId + (System.currentTimeMillis() / 1000L);
    										
    										byte[] imgBytes = BinaryPartAbstractImage.getImage(wordMLPackage, graphic);
    										
    										
    										String srPath = servletPath + "upload";
    										String imgPath = "/" + imgName + embExt;
    										File imgDir = new File(srPath);
    										File imgFile = new File(srPath + imgPath);
    										if( !imgDir.exists() ) {
    											imgDir.mkdir();
    										}
    										
    										System.out.print(getServletContext().getRealPath("/"));
    										
    										FileOutputStream fos = new FileOutputStream(imgFile);
    										fos.write(imgBytes);
    										fos.close();
    										
    										long imgWidth = inlineEx.getCx() / 9525;
    										long imgHeight = inlineEx.getCy() / 9525;
    										
    										drawingStyleEle.addAttribute("width", imgWidth + "");
    										drawingStyleEle.addAttribute("height", imgHeight + "");
    										
    										// save drawing bin to local and return a URL path
    	    								String drawingURL = Config.appBase + "/upload" + imgPath;
    	    								drawingContentEle.addText(drawingURL);
    										
    										break;
    									}
    								}
    							}
    						}
    					}
    				}
    				
    			} else if( ptClassName.equals("javax.xml.bind.JAXBElement") && ((JAXBElement)pt).getDeclaredType().getName().equals("org.docx4j.wml.Tbl") ) {
    				Tbl tbl = (org.docx4j.wml.Tbl)((JAXBElement)pt).getValue();
    				Element tblEle = root.addElement("table");
    				
    				Element[] rcPrEle = new Element[20];
    				for( int i = 0; i < rcPrEle.length; ++i ) {
    					rcPrEle[i] = null;
    				}
    				List tblContent = tbl.getContent();	
    				for (Object r : tblContent ) {
    			          
    					if ( r instanceof org.docx4j.wml.Tr) {   
    			        	org.docx4j.wml.Tr row = (org.docx4j.wml.Tr)r;
    			        	TrPr rowPr = row.getTrPr();
    			        	Element rowEle = tblEle.addElement("row");
    			        	
    			        	List rPrs = rowPr.getCnfStyleOrDivIdOrGridBefore();
    			        	for( Object jpr : rPrs ) {
    			        		if( ((JAXBElement)jpr).getDeclaredType().getName().equals("org.docx4j.wml.CTHeight") ) {
    			        			CTHeight ctHeight = (CTHeight)((JAXBElement)jpr).getValue();
    			        			rowEle.addAttribute("height" , Integer.parseInt(ctHeight.getVal().toString()) / 20 / 11 * 14 + "");
    			        			break;
    			        		}
    			        	}
    			        	
    			            
    			        	List rowContent = row.getContent();
    			        	int numC = 0;
    			            for (Object c : rowContent ) {
    			            	if ( c instanceof javax.xml.bind.JAXBElement) {
    			            		String cClassName = ((JAXBElement)c).getDeclaredType().getName();
    			            		
    			                    if ( cClassName.equals("org.docx4j.wml.Tc") ) {
    			                        org.docx4j.wml.Tc cell = (org.docx4j.wml.Tc)((JAXBElement)c).getValue();
    			                        TcPr cellPr = cell.getTcPr();
    			                        GridSpan gridSpan = cellPr.getGridSpan();
    			                        VMerge vm = cellPr.getVMerge();
    			                        if( vm != null && vm.getVal().equals("continue") ) {
    			                        	if( rcPrEle[numC] != null ) {
    			                        		int rowspanAdd = Integer.parseInt(rcPrEle[numC].attributeValue("rowspan", "1")) + 1;
    			                        		rcPrEle[numC].addAttribute("rowspan", rowspanAdd + "");	
    			                        	}
    			                        	numC++;
    			                        	continue;
    			                        }
    			                        		 
    			                        Element cellEle = rowEle.addElement("cell");
    			                        rcPrEle[numC] = cellEle;
    			                        
    			                        TblWidth tcw = cellPr.getTcW();
    			                        cellEle.addAttribute("width", Integer.parseInt(tcw.getW().toString()) / 20 / 11 * 14 + "");
    			                        int colspan = 1;
    			                        if( gridSpan != null ) {
    			                        	colspan = Integer.parseInt(gridSpan.getVal().toString());
    			                        }
    			                        
    			                        cellEle.addAttribute("colspan", colspan + "");
    			                        cellEle.addAttribute("rowspan", 1 + "");

    			                        addContentToElement(cellEle, cell, wordDocumentPart, wordMLPackage);

        			                    numC += colspan;
    			                    }
    			                }
    			            }
    					}
    				}
    			}
    		}
    	} catch(Exception e) {
    		e.printStackTrace();
    	}
    }


}
