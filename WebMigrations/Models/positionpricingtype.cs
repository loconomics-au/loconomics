namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("positionpricingtype")]
    public partial class positionpricingtype
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PositionID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PricingTypeID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ClientTypeID { get; set; }

        [Key]
        [Column(Order = 3)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 4)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public virtual clienttype clienttype { get; set; }

        public virtual pricingtype pricingtype { get; set; }

        public virtual position position { get; set; }
    }
}
