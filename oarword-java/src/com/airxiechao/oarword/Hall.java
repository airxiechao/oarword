package com.airxiechao.oarword;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.ServletRequestEvent;
import javax.servlet.ServletRequestListener;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 * Application Lifecycle Listener implementation class Hall
 *
 */
public class Hall implements ServletContextListener, HttpSessionListener, ServletRequestListener {
	
	private Ticket[] tickets = new Ticket[10];
	private int pointer = 0;

    /**
     * Default constructor. 
     */
    public Hall() {
    	for( int i = 0; i < 10; ++i ) {
    		tickets[i] = null;
		}
    }
    
    public List<Ticket> getTickets() {
    	List<Ticket> all = new ArrayList<Ticket>();
    	
    	synchronized(tickets) {
    		for( int i = 0; i < 10; ++i ) {
    			if( tickets[i] != null ) {
        			all.add(tickets[i]);
    			}
    		}
    	}
    	
    	return all;
    }
    
    public void putTicket(Ticket tik) {
    	synchronized(tickets) {
    		tickets[pointer] = tik;
    		pointer = (pointer + 1) % 10;
    	}	
    }

	/**
     * @see ServletRequestListener#requestDestroyed(ServletRequestEvent)
     */
    public void requestDestroyed(ServletRequestEvent event) {
        // TODO Auto-generated method stub
    }

	/**
     * @see ServletContextListener#contextInitialized(ServletContextEvent)
     */
    public void contextInitialized(ServletContextEvent event) {
    	event.getServletContext().setAttribute("Hall", this);
    }

	/**
     * @see HttpSessionListener#sessionCreated(HttpSessionEvent)
     */
    public void sessionCreated(HttpSessionEvent event) {
        // TODO Auto-generated method stub
    }

	/**
     * @see HttpSessionListener#sessionDestroyed(HttpSessionEvent)
     */
    public void sessionDestroyed(HttpSessionEvent event) {
        // TODO Auto-generated method stub
    }

	/**
     * @see ServletContextListener#contextDestroyed(ServletContextEvent)
     */
    public void contextDestroyed(ServletContextEvent event) {
        // TODO Auto-generated method stub
    }

	/**
     * @see ServletRequestListener#requestInitialized(ServletRequestEvent)
     */
    public void requestInitialized(ServletRequestEvent event) {
        // TODO Auto-generated method stub
    }
	
}
