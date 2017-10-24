namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("alert")]
    public partial class alert
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int AlertID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int AlertTypeID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 3)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [Required]
        [StringLength(30)]
        public string AlertName { get; set; }

        [StringLength(100)]
        public string AlertHeadlineDisplay { get; set; }

        [Required]
        [StringLength(300)]
        public string AlertTextDisplay { get; set; }

        [StringLength(500)]
        public string AlertDescription { get; set; }

        [StringLength(25)]
        public string AlertEmailText { get; set; }

        public int ProviderProfileCompletePoints { get; set; }

        public int CustomerProfileCompletePoints { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        [StringLength(2000)]
        public string AlertPageURL { get; set; }

        public bool Required { get; set; }

        public bool PositionSpecific { get; set; }

        public int DisplayRank { get; set; }

        public bool ProviderAlert { get; set; }

        public bool CustomerAlert { get; set; }

        public bool bookMeButtonRequired { get; set; }
    }
}
