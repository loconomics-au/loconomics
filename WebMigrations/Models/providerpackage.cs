namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("providerpackage")]
    public partial class providerpackage
    {
        public int ProviderPackageID { get; set; }

        public int PricingTypeID { get; set; }

        public int ProviderUserID { get; set; }

        public int PositionID { get; set; }

        public int LanguageID { get; set; }

        public int CountryID { get; set; }

        [Required]
        [StringLength(50)]
        public string ProviderPackageName { get; set; }

        [StringLength(1000)]
        public string ProviderPackageDescription { get; set; }

        public decimal? ProviderPackagePrice { get; set; }

        public int ProviderPackageServiceDuration { get; set; }

        public bool FirstTimeClientsOnly { get; set; }

        public int NumberOfSessions { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public bool IsAddOn { get; set; }

        public decimal? PriceRate { get; set; }

        [StringLength(30)]
        public string PriceRateUnit { get; set; }

        public bool IsPhone { get; set; }

        public int VisibleToClientID { get; set; }
    }
}
