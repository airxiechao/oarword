package com.airxiechao.oarword;

import java.io.File;
import java.io.IOException;
import java.util.Collections;

import org.artofsolving.jodconverter.OfficeDocumentConverter;
import org.artofsolving.jodconverter.document.DocumentFamily;
import org.artofsolving.jodconverter.document.DocumentFormat;
import org.artofsolving.jodconverter.office.ExternalOfficeManagerConfiguration;
import org.artofsolving.jodconverter.office.OfficeManager;

public class FileConverter {
	private static OfficeManager officeManager;
	
	private static void transformBinaryWordDocToDocX(File in, File out)
	{
	    OfficeDocumentConverter converter = new OfficeDocumentConverter(officeManager);
	    DocumentFormat docx = converter.getFormatRegistry().getFormatByExtension("docx");
	    docx.setStoreProperties(DocumentFamily.TEXT,
	    Collections.singletonMap("FilterName", "MS Word 2007 XML"));

	    converter.convert(in, out, docx);
	}
	
	private static void transformBinaryWordDocToW2003Xml(File in, File out)
	{
	    OfficeDocumentConverter converter = new OfficeDocumentConverter(officeManager);;
	    DocumentFormat w2003xml = new DocumentFormat("Microsoft Word 2003 XML", "xml", "text/xml");
	    w2003xml.setInputFamily(DocumentFamily.TEXT);
	    w2003xml.setStoreProperties(DocumentFamily.TEXT, Collections.singletonMap("FilterName", "MS Word 2003 XML"));
	    converter.convert(in, out, w2003xml);
	}
	
	public static void setupManager() throws IOException {

	  officeManager = new ExternalOfficeManagerConfiguration()
	  		.setConnectOnStart(true)
	  		.setHost(Config.getLibreOfficeServer())
	  		.setPortNumber(Config.getLibreOfficePort())
	  		.buildOfficeManager();
	  
	  officeManager.start();
	}
	
	public static void shutdownManager() throws IOException {
	    officeManager.stop();
	}
	
	public static void convert(String fin, String fout) throws Exception {
		try {
			setupManager();

			OfficeDocumentConverter converter = new OfficeDocumentConverter(officeManager);
			File in = new File(fin);
			File out = new File(fout);
			
			String inExt = fin.substring(fin.lastIndexOf(".") + 1);
			String outExt = fout.substring(fout.lastIndexOf(".") + 1);
			
			if( inExt.equals("doc") && outExt.equals("docx") ) {
				// doc to docx
				transformBinaryWordDocToDocX(in, out);
				
			} else {
				converter.convert(in, out);	
			}
	
		} catch( Exception e ) {
			e.printStackTrace();
			throw new Exception();
		} finally {
			try {
				shutdownManager();
			} catch (IOException e) {
				e.printStackTrace();
				throw new Exception();
			}
		}
		
	}
}
