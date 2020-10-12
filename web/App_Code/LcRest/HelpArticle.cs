using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using LcMarkdown;
using Markdig;
using Markdig.Renderers;
using RestSharp;

namespace LcRest
{
    /// <summary>
    /// Summary description for HelpArticle
    /// </summary>
    public class HelpArticle
    {
        #region fields
        public int author_id;
        public bool draft;
        public int id;
        public string locale;
        public int permission_group_id;
        public string title;
        public string body;
        public int section_id;
        public int user_segment_id;

        #endregion
        public HelpArticle()
        {
            //
            // TODO: Add constructor logic here
            //
        }

        public static IEnumerable<HelpArticle> GetFullList(int languageID, int countryID)
        {
            LcContent content = new LcContent();
            var cached = HttpContext.Current.Cache["ClassCollection:HelpArticle"] as List<HelpArticle>;
            if (cached == null)
            {
                cached = content.GetHelpArticleList().ToList();
                HttpContext.Current.Cache["ClassCollection:HelpArticle"] = cached;
            }

            return cached;
        }

    }
}