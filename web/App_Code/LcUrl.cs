﻿using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web;

/// <summary>
/// The only recommended way to create URLs safety for all the
/// site and communications.
/// Use *Path Properties for pages and *Url for communications.
/// </summary>
public static class LcUrl
{
    /// <summary>
	/// Get the Site Root URL of the current request.
    /// Never will return a trailing slash.
    /// Example: http://www.loconomics.com.au
	/// </summary>
	/// <returns></returns>
    public static string SiteUrl
    {
        get
        {
            //Request.Url.GetComponents(UriComponents.SchemeAndServer, UriFormat.Unescaped);

            HttpContext context = HttpContext.Current;
            // Because some problems with URL creation on ScheduledTasks on hosting, we cannot
            // allow create URLs using the hosting canonical URLs (as loconomi.w03.wh-2.com),
            // we must check that if is Not in a local environment (localhost, local ip or alias,
            // let say everything without '.com' in the name to avoid in-dev problems)
            // and is Not in our real domain (loconomics.com.au) we must enforce to use that
            // domain (loconomics.com.au) with or without subdomain depending on the channel
            // (no subdomain for live, but yes for everything else)
            var domain = context.Request.Url.Authority;
            if (domain.Contains(".com") && 
                !domain.Contains("loconomics.com.au"))
            {
                domain = (ASP.LcHelpers.Channel == "live" ? "" : 
                    ASP.LcHelpers.Channel + ".")
                    + "loconomics.com.au";
            }
            
            return context.Request.Url.Scheme + "://" + domain;
        }
    }
    /// <summary>
	/// Get the current virtual app path, will be empty for root app.
    /// Ever will return a begining and trailing slash (or unique slash if there is no path)
    /// Example: /testing/ or /
	/// </summary>
	/// <returns></returns>
    public static string AppPath
    {
        get
        {
            HttpContext context = HttpContext.Current;
            string url = "";
            // IsLocal doesn't work here: because in hosting for email templates returns true creating bad links
            // We need this only when executed out of the loconomics.com.au domain, as in local ('dev' channel) or
            // in hosting using the hosting cannonical urls (as in winhost: http://loconomi.w03.wh-2.com, this is
            // important for ScheduledTask execution and the restricted scheduled tasks configuration of winhost)
            if (!context.Request.Url.Authority.Contains("loconomics.com.au"))
            {
                url = context.Request.ApplicationPath;
            }

            if(context.Request.Url.Authority.Contains("localdev.loconomics.com.au"))
            {
                url = context.Request.ApplicationPath;
            }
                
            if (url.EndsWith("/"))
            {
                return url;
            }                
            else
            {
                return url + "/";
            }
                
        }
    }

    /// <summary>
	/// Get the current virtual app URL, is just the SiteUrl with the AppPath
    /// Ever will return a trailing slash
    /// Example: http://www.loconomics.com.au/testing/
	/// </summary>
	/// <returns></returns>
    public static string AppUrl
    {
        get
        {
            // Dont use AppPath if is being executed on winhost 
            var domain = HttpContext.Current.Request.Url.Authority;
            return SiteUrl + (domain.Contains(".com") ? "/" : AppPath);
        }
    }

    /// <summary>
	/// Get the current web site url for email links, can be different from the application url if we are using a CDN
    /// Ever will return a trailing slash
    /// Example: http://www.loconomics.com.au/testing/
	/// </summary>
	/// <returns></returns>
    public static string AppEmailUrl
    {
        get
        {
            string configValue = ConfigurationManager.AppSettings["appEmailUrl"];

            if (string.IsNullOrEmpty(configValue))
            {
                // default to usual AppUrl
                return AppUrl;
            }

            return configValue;
        }
    }

    /// <summary>
	/// Get the current virtual app path plus the language path
    /// Ever will return a begining and trailing slash.
	/// </summary>
	/// <returns></returns>
    public static string LangPath{
        get
        {
            return AppPath + LangId + "/";
        }
    }
    /// <summary>
	/// Get the current virtual app URL plus the language path
    /// Ever will return a trailing slash.
	/// </summary>
	/// <returns></returns>
    public static string LangUrl{
        get
        {
            return AppUrl + LangId + "/";
        }
    }
    /// <summary>
    /// Get the Lang Identifier for URL.
    /// Example: en-US, es-ES
    /// </summary>
    public static string LangId
    {
        get
        {
            return System.Globalization.CultureInfo.CurrentUICulture.Name;
        }
    }
    /// <summary>
	/// Get the absolute path to the generic JSON URI. At this URI are most of pages that
    /// return data as JSON, but note that some specific pages can return JSON out of this URL.
    /// Ever will return a begining and trailing slash.
	/// </summary>
	/// <returns></returns>
    public static string JsonPath{
        get
        {
            return LangPath + "JSON/";
        }
    }
    /// <summary>
	/// Get the full URL to the generic JSON URI. At this URI are most of pages that
    /// return data as JSON, but note that some specific pages can return JSON out of this URL.
    /// Ever will return a trailing slash.
	/// </summary>
	/// <returns></returns>
    public static string JsonUrl{
        get
        {
            return LangUrl + "JSON/";
        }
    }
    /// <summary>
    /// Returns a Json string with all the static data included in this class.
    /// Util to use from javascript code.
    /// </summary>
    /// <returns></returns>
    public static string ToJson()
    {
        var d = new Dictionary<string, string>(){
            { "SiteUrl", SiteUrl },
            { "AppPath", AppPath },
            { "AppUrl", AppUrl },
            { "LangPath", LangPath },
            { "LangUrl", LangUrl },
            { "LangId", LangId },
            { "JsonPath", JsonPath },
            { "JsonUrl", JsonUrl }
        };
        return System.Web.Helpers.Json.Encode(d);
    }
    public static string ToJsVar()
    {
        return "var LcUrl = " + ToJson() + ";";
    }

    private static string RenderBase
    {
        get
        {
            return (HttpContext.Current.Request.Url.Authority.Contains("loconomics.com.au") ? "~" : "");
        }
    }

    /// <summary>
    /// Only for use with RenderPage
    /// </summary>
    public static string RenderLangPath
    {
        get
        {
            return RenderBase + LangPath;
        }
    }
    /// <summary>
    /// Only for use with RenderPage
    /// </summary>
    public static string RenderAppPath
    {
        get
        {
            return RenderBase + AppPath;
        }
    }

    public static string GetTheGoodURL(string url)
    {
        if (HttpContext.Current.Request.IsLocal)
            return url;
        HttpContext context = HttpContext.Current;
        var appPath = context.Request.ApplicationPath ?? "";
        // Shortcut on app running at the root of the URL, since
        // that is a good URL already, and any further processing will cause
        // a bug since it will strip the beggining slash and we need one for any
        // URL returned by this method (as happened and fixed at #1137).
        if (appPath == "/")
            return url;
        var i = url.IndexOf(appPath);
        if (i > -1)
            return url.Substring(i + appPath.Length);
        return url;
    }
}
