namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("county")]
    public partial class county
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public county()
        {
            municipalities = new HashSet<municipality>();
            postalcodes = new HashSet<postalcode>();
        }

        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountyID { get; set; }

        [StringLength(100)]
        public string CountyName { get; set; }

        public int? FIPSCode { get; set; }

        public int StateProvinceID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        public virtual stateprovince stateprovince { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<municipality> municipalities { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<postalcode> postalcodes { get; set; }
    }
}
