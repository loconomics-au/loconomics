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
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            var cached = HttpContext.Current.Cache["ClassCollection:HelpArticle"] as List<HelpArticle>;
            if (cached == null)
            {
                var client = new RestClient("https://api.github.com");
                var request = new RestRequest("/repos/loconomics-au/coop-website/contents/help/articles/205985385-how-do-i-import-and-sync-my-existing-calendar.md", Method.GET);
                request.RequestFormat = DataFormat.Json;

                var response = client.Execute<HelpPage>(request);

                var content = Base64Decode(response.Data.Content);

                var article = content.GetFrontMatter<HelpArticleFrontMatter>();
                var html = ParseMarkdown(content);
                article.Content = ParseMarkdown(content);

                cached = new List<HelpArticle>() { new HelpArticle { id = article.Id, user_segment_id = 123, title = article.Title, body = article.Content, section_id = article.SectionId } };
                HttpContext.Current.Cache["ClassCollection:HelpArticle"] = cached;
            }

            return cached;
        }

        public static string Base64Decode(string base64EncodedData)
        {
            var base64EncodedBytes = System.Convert.FromBase64String(base64EncodedData);
            return System.Text.Encoding.UTF8.GetString(base64EncodedBytes);
        }

        private static string ParseMarkdown(string markdown)
        {
            var builder = new MarkdownPipelineBuilder()
                .UseEmphasisExtras()
                .UsePipeTables()
                .UseGridTables()
                .UseFooters()
                .UseFootnotes()
                .UseCitations()
                .UseAutoLinks() // URLs are parsed into anchors
                //.UseAutoIdentifiers(AutoIdentifierOptions.GitHub) // Headers get id="name" 
                .UseAbbreviations()
                .UseYamlFrontMatter()
                .UseEmojiAndSmiley(true)
                .UseMediaLinks()
                .UseListExtras()
                .UseFigures()
                .UseTaskLists()
                .UseCustomContainers()
                .UseGenericAttributes();
            MarkdownPipeline Pipeline = builder.Build();
            var htmlWriter = new StringWriter();
            var renderer = new HtmlRenderer(htmlWriter);

            Markdown.Convert(markdown, renderer, Pipeline);

            var html = htmlWriter.ToString();

            return html;
        }
    }

    public class HelpPage
    {
        public string Name { get; set; }
        public string Content { get; set; }
    }
}