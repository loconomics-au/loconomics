namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("stateprovince")]
    public partial class stateprovince
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public stateprovince()
        {
            counties = new HashSet<county>();
            institutions = new HashSet<institution>();
            postalcodes = new HashSet<postalcode>();
        }

        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int StateProvinceID { get; set; }

        [StringLength(100)]
        public string StateProvinceName { get; set; }

        [StringLength(25)]
        public string StateProvinceCode { get; set; }

        public int CountryID { get; set; }

        [StringLength(25)]
        public string RegionCode { get; set; }

        [StringLength(25)]
        public string PostalCodePrefix { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<county> counties { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<institution> institutions { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<postalcode> postalcodes { get; set; }
    }
}
