namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class PricingGroup
    {
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PricingGroupID { get; set; }

        [Required]
        [StringLength(50)]
        public string InternalGroupName { get; set; }

        [Required]
        [StringLength(100)]
        public string SelectionTitle { get; set; }

        [Required]
        [StringLength(100)]
        public string SummaryTitle { get; set; }

        [Required]
        [StringLength(100)]
        public string DynamicSummaryTitle { get; set; }

        public int? LanguageID { get; set; }

        public int? CountryID { get; set; }
    }
}
