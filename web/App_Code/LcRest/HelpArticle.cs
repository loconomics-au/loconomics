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
        public int author_id { get; set; }
        public bool draft { get; set; }
        public int id { get; set; }
        public string locale { get; set; }
        public int permission_group_id { get; set; }
        public string title { get; set; }
        public string body { get; set; }
        public int section_id { get; set; }
        public int user_segment_id { get; set; }
        #endregion

        private readonly LcContent content;

        public HelpArticle()
        {
            content = new LcContent();
        }

        public IEnumerable<HelpArticle> GetFullList(int languageID, int countryID)
        {
            var articles = new List<HelpArticleFrontMatter>();
            return content.GetHelpArticleList(out articles).ToList();
        }
    }
}