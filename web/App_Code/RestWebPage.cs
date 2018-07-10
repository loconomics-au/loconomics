﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;
using System.Web.Routing;

/// <summary>
/// Base class to simplify implementation of REST pages
/// throught asp.net WebPages framework (.cshtml).
/// 
/// This class must be inherit implementing the methods 
/// supported (GET, POST, PUT or DELETE), and gets
/// executed by make an instance of the subclass
/// and executing Run or JsonResponse with a reference
/// to the WebPage object (in .cshtml files is the 'this'
/// reference).
/// </summary>
public class RestWebPage
{
    public System.Web.WebPages.WebPage WebPage;

    public HttpRequestBase Request
    {
        get
        {
            return WebPage.Request;
        }
    }
    public System.Web.WebPages.Html.ModelStateDictionary ModelState
    {
        get
        {
            return WebPage.ModelState;
        }
    }
    public System.Web.WebPages.ValidationHelper Validation
    {
        get
        {
            return WebPage.Validation;
        }
    }
    
    private IList<string> _urlData;
    public IList<string> UrlData
    {
        get
        {
            if (_urlData == null)
            {
                // NOTE: The call to RouteTable.Routes.MapWebPageRoute
                // must use the placeholder name {*urldata} for the 
                // dynamic part of the URL that want to be catched up
                // as a typical WebPage.UrlData.
                var rpath = WebPage.Context.GetRouteValue("urldata");

                if (rpath != null)
                {
                    _urlData = OptionalItemsList<string>.FromUrlPath(rpath);
                }
                else
                {
                    // On null, treat as this was not routed, just direct
                    // WebPage call, use the standard:
                    _urlData = WebPage.UrlData;
                }
            }

            return _urlData;
        }
    }
    public int StatusCode
    {
        get
        {
            return WebPage.Response.StatusCode;
        }
        set
        {
            WebPage.Response.StatusCode = value;
        }
    }

    public virtual dynamic Get()
    {
        throw new HttpException(405, "GET is not allowed");
    }
    public virtual dynamic Post()
    {
        throw new HttpException(405, "POST is not allowed");
    }
    public virtual dynamic Put()
    {
        throw new HttpException(405, "PUT is not allowed");
    }
    public virtual dynamic Delete()
    {
        throw new HttpException(405, "DELETE is not allowed");
    }

    /// <summary>
    /// Executes the page code of the desired method
    /// and returns an object with the result.
    /// That result must be piped to the response manually
    /// (or use JsonResponse).
    /// </summary>
    /// <param name="WebPage"></param>
    /// <returns></returns>
    public dynamic Run(System.Web.WebPages.WebPage WebPage)
    {
        this.WebPage = WebPage;

        dynamic result = null;

        // For all requests:
        // No cache
        WebPage.Response.Cache.SetExpires(DateTime.UtcNow.AddDays(-1));
        WebPage.Response.Cache.SetValidUntilExpires(false);
        WebPage.Response.Cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
        WebPage.Response.Cache.SetCacheability(HttpCacheability.NoCache);
        WebPage.Response.Cache.SetNoStore();
        // No cookies
        WebPage.Response.Cookies.Clear();

        try
        {
            switch (Request.HttpMethod.ToUpper())
            {
                case "GET":
                    result = Get();
                    break;
                case "POST":
                    // By general, if everything goes fine, a 'post' must return
                    // the http code '201:Created'. On any error will be replaced.
                    // And can be explicitely replaced by the specific page on the
                    // overrided 'Post()' method
                    WebPage.Response.StatusCode = 201;
                    result = Post();
                    break;
                case "PUT":
                    result = Put();
                    break;
                case "DELETE":
                    result = Delete();
                    break;
                case "OPTIONS":
                    // Just let asp.net to response empty with the
                    // custom headers for CORS that were set in the web.config
                    break;
                default:
                    throw new HttpException(405, String.Format("{0} is not allowed", Request.HttpMethod));
            }

        }
        catch (ValidationException valEx)
        {
            result = new Dictionary<string, dynamic>();
            result["errorMessage"] = LcRessources.ValidationSummaryTitle;
            result["errorSource"] = "validation";

            var errors = new System.Collections.Hashtable();
            if (!String.IsNullOrEmpty(valEx.ContainerName))
            {
                errors[valEx.ContainerName + "." + valEx.ParamName] = valEx.Message;
            }
            errors[valEx.ParamName] = valEx.Message;
            result["errors"] = errors;

            WebPage.Response.StatusCode = 400;
        }
        catch (HttpException http)
        {
            result = new Dictionary<string, dynamic>();

            WebPage.Response.StatusCode = http.GetHttpCode();

            result["errorMessage"] = http.Message;
            if (!ModelState.IsValid)
            {
                result["errorSource"] = "validation";
                result["errors"] = ModelState.Errors();
            }

            if (WebPage.Response.StatusCode == 500)
            {
                if (ASP.LcHelpers.InDev)
                    result["exception"] = http;
                else
                    LcLogger.LogAspnetError(http);
            }
        }
        catch (Exception ex)
        {
            result = new Dictionary<string, dynamic>();
            result["errorMessage"] = ex.Message;
            // Bad Format code for "Constraint" or Internal server error:
            WebPage.Response.StatusCode = ex is ConstraintException ? 400 : 500;

            if (ASP.LcHelpers.InDev)
                result["exception"] = ex;
            else
                LcLogger.LogAspnetError(ex);
        }

        return result;
    }

    /// <summary>
    /// Executes the page code of the desired method
    /// and send it as JSON to the Http Response.
    /// </summary>
    /// <param name="WebPage"></param>
    public void JsonResponse(System.Web.WebPages.WebPage WebPage)
    {
        var data = Run(WebPage);

        if (data is CsvHelper.CsvWriter)
        {
            WebPage.Response.ContentType = "text/csv";
            WebPage.Response.End();
            return;
        }

        WebPage.Response.ContentType = "application/json";
        // JSON.NET Works Better: good datetime formatting as ISO-8601 and some bugfixes details.
        // IMPORTANT: Ideally, we must return dates as UTC, but currently datetimes from database are not detected as 'local'
        // so trying to return as 'utc' with DateTimezoneHandling.UTc results in the same time with a 'Z' in the end, that's an error.
        // Almost, using 'Local' will append the correct offset and browsers/javascript engines do the conversion correctly.
        WebPage.Response.Write(Newtonsoft.Json.JsonConvert.SerializeObject(data, new Newtonsoft.Json.JsonSerializerSettings
        {
            DateTimeZoneHandling = Newtonsoft.Json.DateTimeZoneHandling.Local
        }));
        //Json.Write(jsondata, Response.Output);
        //WebPage.Response.End();
    }

    public void RequiresUser(LcData.UserInfo.UserType userType)
    {
        this.WebPage.Response.RestRequiresUser(userType);
    }

    #region CSV Export
    /// <summary>
    /// Prepares the response output to be done as a CSV file, returning a wrapper that serialized the data
    /// that should be returned to let the process finalize (as of a Get, Post, Put, Delete methods).
    /// </summary>
    /// <param name="data"></param>
    /// <param name="downloadWithFilename">If given, force browser to download the content with the given file name</param>
    /// <returns></returns>
    public CsvHelper.CsvWriter ExportAsCsv(IEnumerable<object> data, string downloadWithFilename = null)
    {
        if (!String.IsNullOrEmpty(downloadWithFilename))
        {
            WebPage.Response.AddHeader("Content-Disposition", "attachment; filename=" + downloadWithFilename);
        }

        var csv = new CsvHelper.CsvWriter(WebPage.Response.Output);
        csv.Configuration.MemberTypes = CsvHelper.Configuration.MemberTypes.Fields | CsvHelper.Configuration.MemberTypes.Properties;
        csv.WriteRecords(data);

        return csv;
    }
    #endregion

    #region REST utilities
    /// <summary>
    /// Time format in ISO-8601, suitable for JSON
    /// </summary>
    public const string TimeFormat = @"hh\:mm\:ss";
    /// <summary>
    /// Convert a time (as TimeSpan or DateTime) in
    /// ISO string format, or null if not a correct value.
    /// </summary>
    /// <param name="time"></param>
    /// <returns></returns>
    public static string TimeToISO(object time)
    {
        return (time is DateTime) ? ((DateTime)time).TimeOfDay.ToString(TimeFormat) :
            (time is TimeSpan) ? ((TimeSpan)time).ToString(TimeFormat) :
            null;
    }
    public static TimeSpan? TimeSpanFromISO(string timespan)
    {
        TimeSpan ts;
        return (TimeSpan.TryParseExact(timespan, TimeFormat, null, out ts)) ?
            (TimeSpan?)ts :
            null;
    }
    public static DateTimeOffset? DateTimeOffsetFromISO(string datetime)
    {
        DateTimeOffset dt;
        return (DateTimeOffset.TryParse(datetime, out dt)) ?
            (DateTimeOffset?)dt.ToLocalTime() :
            null;
    }
    #endregion
}