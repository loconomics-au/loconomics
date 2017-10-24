namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("providerservicephoto")]
    public partial class providerservicephoto
    {
        public int ProviderServicePhotoID { get; set; }

        public int UserID { get; set; }

        public int PositionID { get; set; }

        [StringLength(50)]
        public string PhotoCaption { get; set; }

        [Required]
        [StringLength(2073)]
        public string PhotoAddress { get; set; }

        public int RankPosition { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public bool IsPrimaryPhoto { get; set; }
    }
}
