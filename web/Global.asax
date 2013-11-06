﻿<%@ Application Language="C#" %>

<script runat="server">

    void Application_Start(object sender, EventArgs e) 
    {
        // Código que se ejecuta al iniciarse la aplicación

    }
    
    void Application_End(object sender, EventArgs e) 
    {
        //  Código que se ejecuta cuando se cierra la aplicación

    }
        
    void Application_Error(object sender, EventArgs e) 
    {
        Exception ex = Server.GetLastError();
        // Special cases (each page creates its own log file)
        if (ex is HttpException)
        {
            switch (((HttpException)ex).GetHttpCode()){
                case 404:
                    Server.TransferRequest(LcUrl.RenderAppPath + "Errors/Error404/");
                    // Execution ends right here.
                    break;
                case 403:
                    Server.TransferRequest(LcUrl.RenderAppPath + "Errors/Error403/");
                    // Execution ends right here.
                    break;
            }
        }

        if (ex is HttpUnhandledException && ex.InnerException != null)
        {
            ex = ex.InnerException;
        }

        if (ex != null)
        {
            try
            {
                using (var logger = new LcLogger("aspnet-errors"))
                {
                    try
                    {
                        logger.Log("Page error, unhandled exception caugth at Global.asax, context:");
                        logger.Log("User:: {0}:{1}", WebMatrix.WebData.WebSecurity.CurrentUserId, WebMatrix.WebData.WebSecurity.CurrentUserName);
                        logger.Log("Request:: {0} {1}", Request.HttpMethod, Request.RawUrl);
                        logger.Log("User-Agent:: {0}", Request.UserAgent);
                        try
                        {
                            logger.Log("Form Data::");
                            logger.LogData(ASP.LcHelpers.NameValueToString(Request.Form));
                        }
                        catch { }
                        logger.LogEx("Page error details", ex);
                    }
                    catch { }
                    logger.Save();
                }
            }
            catch { }

            if (!ASP.LcHelpers.InDev)
            {
                //Microsoft.Practices.EnterpriseLibrary.ExceptionHandling.
                //   ExceptionPolicy.HandleException(ex, "AllExceptionsPolicy");
                Server.ClearError();
                // Show custom error page, preserving current URL:
                Server.TransferRequest(LcUrl.RenderAppPath + "Errors/Error/");
                // Execution ends right here
            }
        }
    }

    void Session_Start(object sender, EventArgs e) 
    {
        // We check if user browser sent an auth cookie (lcAuth), if is a non persistent cookie
        // (have not expired date), we force logout; this is how non persistent sessions die
        // when server-session timeout dies, sharing this configurable time 
        // (web.config/system.web/sessionState/timeout)
        // NOTE: Response.Write lines are debug code.
        var c = Request.Cookies[FormsAuthentication.FormsCookieName]; //["lcAuth"];
        if (c != null)
        {
            var t = FormsAuthentication.Decrypt(c.Value);
            if (!t.IsPersistent)
            {
                // Non persistent
                //Response.Write("session cookie!");
                WebMatrix.WebData.WebSecurity.Logout();
            }
            /*else
            {
                // persistent
                Response.Write("persistent cookie until: " + t.Expiration.ToString());
            }*/
        }
        
    }

    void Session_End(object sender, EventArgs e) 
    {
        // Código que se ejecuta cuando finaliza una sesión. 
        // Nota: El evento Session_End se desencadena sólo con el modo sessionstate
        // se establece como InProc en el archivo Web.config. Si el modo de sesión se establece como StateServer 
        // o SQLServer, el evento no se genera.

    }

    void Application_BeginRequest(object sender, EventArgs e)
    {
        // TODO: This culture setting must be setted using the user preference at
        // Session_Start, when select a language form the dropdown or after login with
        // database preferences.
        System.Threading.Thread.CurrentThread.CurrentCulture =
        System.Threading.Thread.CurrentThread.CurrentUICulture = 
        System.Globalization.CultureInfo.CreateSpecificCulture("en-US");
        
        // Autologin
        LcAuth.RequestAutologin(Request);
    }
    void Application_EndRequest(object sender, EventArgs e)
    {
        LcData.UserInfo.RegisterLastActivityTime();
        LcHelpers.CloseDebugLogger();
        /* TESTING
        using (var f = System.IO.File.AppendText(Request.MapPath(LcUrl.RenderAppPath + "EndRequest.log")))
        {
            f.WriteLine("EXECUTION: " + (HttpContext.Current.Handler.GetType()).ToString());
        } */
    }
       
</script>
