package com.airxiechao.oarword;

import java.io.File;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.swing.ImageIcon;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.docx4j.Docx4jProperties;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.docx4j.utils.Log4jConfigurator;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;

/**
 * Servlet implementation class InsertLocalImage
 */
public class InsertLocalImage extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	private int maxFileSize = 1 * 1024 * 1025;
	private int maxMemSize = 500 * 1024;
	private String sessionId = "0";
	private String servletPath;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public InsertLocalImage() {
        super();
        
		Docx4jProperties.getProperties().setProperty("docx4j.Log4j.Configurator.disabled", "true");
		Log4jConfigurator.configure();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
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

			if ( i.hasNext () ) 
			{
				FileItem fi = (FileItem)i.next();

				if ( !fi.isFormField () )	
				{
					String fileName = sessionId + (System.currentTimeMillis() / 1000L);
					String fileExt = fi.getName().substring(fi.getName().lastIndexOf("."));
					
		            String fieldName = fi.getFieldName();
		            String contentType = fi.getContentType();
		            boolean isInMemory = fi.isInMemory();
		            long sizeInBytes = fi.getSize();
		            
		            file = new File( filePath + "/" + fileName + fileExt ) ;
		            
		            fi.write(file) ;
		            
		            System.out.println("Uploaded Filename: " + file.getAbsolutePath());
				}
	      	}
			
			if( file != null && new ImageIcon(file.getAbsolutePath()).getIconWidth() != -1 ) {
	    		String imgPath = Config.getAppBase() + "/upload/" + file.getName();
	    		response.setCharacterEncoding("UTF-8");
	    		response.getWriter().print(imgPath);
			} else {
				throw new Exception();
			}
			
	   	}catch(Exception e) {
	   		e.printStackTrace();
	   		response.getWriter().print("error");
	   	}	
	}

}
