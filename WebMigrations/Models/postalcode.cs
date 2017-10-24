namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("postalcode")]
    public partial class postalcode
    {
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PostalCodeID { get; set; }

        [Column("PostalCode")]
        [StringLength(25)]
        public string PostalCode1 { get; set; }

        [StringLength(250)]
        public string City { get; set; }

        public int StateProvinceID { get; set; }

        public int CountryID { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public decimal? StandardOffset { get; set; }

        public bool? DST { get; set; }

        [StringLength(250)]
        public string Location { get; set; }

        [StringLength(50)]
        public string PostalCodeType { get; set; }

        public DateTime? CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public int MunicipalityID { get; set; }

        public int CountyID { get; set; }

        public virtual county county { get; set; }

        public virtual municipality municipality { get; set; }

        public virtual stateprovince stateprovince { get; set; }
    }
}
