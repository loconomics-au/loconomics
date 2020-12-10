using LcMarkdown;
using LcRest;
using Markdig;
using Markdig.Renderers;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for LcContent
/// </summary>
public class LcContent
{
    public string pagesOwnerRepo;
    public RestClient restClient;
    public LcContent()
    {
        restClient = new RestClient("https://api.github.com");
        pagesOwnerRepo = ConfigurationManager.AppSettings["pagesOwnerRepo"];
    }

    public IEnumerable<HelpCategory> GetHelpCategories()
    {
        List<HelpArticleFrontMatter> frontMatterArticles;
        GetHelpArticleList(out frontMatterArticles);

        List<HelpCategory> helpCategories = (from c in frontMatterArticles
                                             select new { c.CategoryId, c.Category })
                                             .Distinct()
                                             .Select(o => new HelpCategory() { id = o.CategoryId, name = o.Category })
                                             .ToList();

        return helpCategories;
    }

    public IEnumerable<HelpSection> GetHelpSections()
    {
        List<HelpArticleFrontMatter> frontMatterArticles;
        GetHelpArticleList(out frontMatterArticles);

        List<HelpSection> helpSections = (from s in frontMatterArticles
                                          select new { s.CategoryId, s.SectionId, s.Section })
                                          .Distinct()
                                          .Select(o => new HelpSection() { category_id = o.CategoryId, id = o.SectionId, name = o.Section })                                          
                                          .ToList();

        return helpSections;
    }

    public IEnumerable<HelpArticle> GetHelpArticleList(out List<HelpArticleFrontMatter> cached)
    {
        cached = HttpContext.Current.Cache["ClassCollection:LcMarkdown.HelpArticleList"] as List<HelpArticleFrontMatter>;
        if (cached == null)
        {
            var request = new RestRequest("/repos/" + pagesOwnerRepo + "/contents/help/articles/", Method.GET);
            request.RequestFormat = DataFormat.Json;

            var response = restClient.Execute<List<HelpPage>>(request);

            List<HelpArticleFrontMatter> frontMatterArticles = new List<HelpArticleFrontMatter>();
            foreach (var page in response.Data)
            {
                HelpArticleFrontMatter frontMatter;
                HelpArticle article = GetHelpArticle(page.Path, out frontMatter);
                frontMatterArticles.Add(frontMatter);
            }

            cached = frontMatterArticles;
            HttpContext.Current.Cache["ClassCollection:LcMarkdown.HelpArticleList"] = cached;
        }

        List<HelpArticle> helpArticles = (from a in cached
                                         select new HelpArticle() { id = a.Id, title = a.Title, body = a.Content,
                                             section_id = a.SectionId }
                                         )
                                         .ToList();

        return helpArticles;        
    }

    public HelpArticle GetHelpArticle(string path, out HelpArticleFrontMatter cached)
    {
        cached = HttpContext.Current.Cache["ClassInstance:LcMarkdown.HelpArticleFrontMatter:" + path] as HelpArticleFrontMatter;
        //var article = new HelpArticleFrontMatter();

        if (cached == null)
        {
            var request = new RestRequest("/repos/" + pagesOwnerRepo + "/contents/" + path, Method.GET);

            request.RequestFormat = DataFormat.Json;

            var response = restClient.Execute<HelpPage>(request);

            var content = Base64Decode(response.Data.Content);

            cached = content.GetFrontMatter<HelpArticleFrontMatter>() ?? new HelpArticleFrontMatter();
            cached.Content = ParseMarkdown(content);

            HttpContext.Current.Cache["ClassInstance:LcMarkdown.HelpArticleFrontMatter:" + path] = cached;
        }

        return new HelpArticle
        {
            id = cached.Id,
            user_segment_id = 123,
            title = cached.Title,
            body = cached.Content,
            section_id = cached.SectionId
        };
    }

    private string Base64Decode(string base64EncodedData)
    {
        var base64EncodedBytes = System.Convert.FromBase64String(base64EncodedData);
        return System.Text.Encoding.UTF8.GetString(base64EncodedBytes);
    }

    private string ParseMarkdown(string markdown)
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
    
    public class HelpPage
    {
        public string Name { get; set; }
        public string Path { get; set; }
        public string Content { get; set; }
    }
}