﻿<%@ Application Language="C#" %>

<script runat="server">

    void Application_Start(object sender, EventArgs e)
    {
        // Mail password set from special setting that is set at the server settings to avoid
        // write it at files (Azure does not make available to set the system.net-smtp settings from dashboard,
        // but we can put it as appsetting):
        if (String.IsNullOrEmpty(System.Web.Helpers.WebMail.Password))
        {
            System.Web.Helpers.WebMail.UserName = ConfigurationManager.AppSettings["smtpUserName"];
            System.Web.Helpers.WebMail.Password = ConfigurationManager.AppSettings["smtpPassword"];
            System.Web.Helpers.WebMail.From = ConfigurationManager.AppSettings["smtpFrom"];
            System.Web.Helpers.WebMail.SmtpServer = ConfigurationManager.AppSettings["smtpHost"];
            System.Web.Helpers.WebMail.SmtpPort = (int)ConfigurationManager.AppSettings["smtpPort"].AsLong();
            System.Web.Helpers.WebMail.EnableSsl = ConfigurationManager.AppSettings["smtpEnableSsl"] == "true";
        }
        
        i18n.LocalizedApplication.Current.TweakMessageTranslation = delegate(System.Web.HttpContextBase context, i18n.Helpers.Nugget nugget, i18n.LanguageTag langtag, string message)
        {
            switch (context.Response.ContentType)
            {
                case "application/javascript":
                    return message.Replace("\'", "\\'");
            }
            return message;
        };
    }

    void Application_End(object sender, EventArgs e)
    {
    }

    void Application_Error(object sender, EventArgs e)
    {
        Exception ex = Server.GetLastError();
        // Special cases (each page creates its own log file)
        if (ex is HttpException)
        {
            // IMPORTANT: Catch several errors, like 404 "Not Found" works here because
            // we have the custom url rewriting code at _AppStart.cshtml, like:
            //  RouteTable.Routes.MapWebPageRoute("{customurl}/", "~/CustomURL.cshtml");
            // That way, ANY URL that has not a static or asp.net page goes that cshtml page, and that
            // returns an error that is catch here. Without that, this code will never run because IIS
            // runs its own 'not found/errors' logic far before (and customErrors web.config seems to not
            // work for some reason, maybe needs to be in the root config or something in the rewriting there
            // breaks it or the hosting set-up avoids custom errors on web.config).
            switch (((HttpException)ex).GetHttpCode()){
                case 404:
                    // IMPORTANT: To enable splash screen, all not founds goes to index silently
                    //Server.TransferRequest(LcUrl.RenderAppPath + "Errors/Error404/");
                    Response.Redirect("/");
                    // Execution ends right here.
                    break;
                case 403:
                    Server.TransferRequest(LcUrl.RenderAppPath + "Errors/Error403/");
                    // Execution ends right here.
                    break;
            }
        }

        // The wildcard Route for the /api (REST service) will try to map the URL
        // to a 'cshtml' file, if does not exists, the next error is triggered, so
        // we catch it and return the correct message;
        // NO NEED to log this, is just a regular not found, but not controlled by the
        // routing system.
        if (ex is InvalidOperationException && ex.Message.Contains("'WebPagesRouteHandler'"))
        {
            Response.StatusCode = 404;
            Response.Write("Not Found");
            Response.End();
        }

        if (ex is HttpUnhandledException && ex.InnerException != null)
        {
            ex = ex.InnerException;
        }

        if (ex != null)
        {
            try
            {
                LcLogger.LogAspnetError(ex);
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

        // REST OPTIONS preflight request. Be fast and response OK
        // Asp.net will always includes the custom headers from web.config
        if (Request.HttpMethod == "OPTIONS")
        {
            // As max age as possible, to reduce number of preflight requests sent by the client
            Response.Headers["Access-Control-Max-Age"] = "1728000";
            Response.End();
            return;
        }

        // Autologin
        LcAuth.RequestAutologin(Request);
    }
    void Application_EndRequest(object sender, EventArgs e)
    {
        if (ASP.LcHelpers.Channel != "localdev")
        {
            LcData.UserInfo.RegisterLastActivityTime();
        }
        LcHelpers.CloseDebugLogger();

        // IMPORTANT Additional code to make REST pages can
        // resolve to http code 401.
        if (Response.Headers.AllKeys.Contains("REST"))
        {
            var info = Response.Headers["REST"];
            var code = Response.Headers["REST-Code"];
            Response.Headers.Remove("REST");
            Response.Headers.Remove("REST-Code");

            Response.TrySkipIisCustomErrors = true;
            Response.ClearContent();
            Response.StatusCode = int.Parse(code);
            Response.RedirectLocation = null;
            Response.Write(info);
            Response.Flush();
            Response.End();
        }

        /* TESTING
        using (var f = System.IO.File.AppendText(Request.MapPath(LcUrl.RenderAppPath + "EndRequest.log")))
        {
            f.WriteLine("EXECUTION: " + (HttpContext.Current.Handler.GetType()).ToString());
        } */
    }

</script>
