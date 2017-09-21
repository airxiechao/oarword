package com.airxiechao.oarword;

import java.io.InputStream;

import java.util.Properties;

public class Config {
	protected static String appBase = "http://127.0.0.1:8080/oarword";
	protected static String libreOfficeServer = "127.0.0.1";
	protected static int libreOfficePort = 8100;

	protected static void readConfig(){
		try{
			System.out.println("INFO: read config");

			Properties prop = new Properties();
			String fileName = "config.properties";

			ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
			InputStream is = classLoader.getResourceAsStream(fileName);
			prop.load(is);

			appBase = prop.getProperty("appBase");
			libreOfficeServer = prop.getProperty("libreOfficeServer");
			libreOfficePort = Integer.parseInt(prop.getProperty("libreOfficePort"));

			System.out.println("appBase:"+appBase);
			System.out.println("libreOfficeServer:"+libreOfficeServer);
			System.out.println("libreOfficePort:"+libreOfficePort);

		}catch(Exception e){
			System.out.println("Error: config reading error");
			e.printStackTrace();
		}
	}

	public static String getAppBase(){
		readConfig();
		return appBase;
	}

	public static String getLibreOfficeServer(){
		readConfig();
		return libreOfficeServer;
	}

	public static int getLibreOfficePort(){
		readConfig();
		return libreOfficePort;
	}
}
