package com.airxiechao.oarword;

import java.io.IOException;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

/**
 * Servlet implementation class RecentFileName
 */
public class RecentFileName extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public RecentFileName() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		Hall hall = (Hall) getServletContext().getAttribute("Hall");
		
		JsonArray jsonArr = new JsonArray();
		
		List<Ticket> all = hall.getTickets();
		Iterator<Ticket> iter = all.iterator();
		while( iter.hasNext() ) {
			Ticket t = iter.next();
			JsonObject  jsonObj = new JsonObject();
			jsonObj.addProperty("ip", t.getIp());
			jsonObj.addProperty("file", t.getFile());
			jsonObj.addProperty("time", t.getTime());
			
			jsonArr.add(jsonObj);
		}
		
		response.setCharacterEncoding("UTF-8");
		response.getWriter().print(jsonArr.toString());
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}

}
