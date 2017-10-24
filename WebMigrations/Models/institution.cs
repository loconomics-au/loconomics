namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("institution")]
    public partial class institution
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public institution()
        {
            usereducations = new HashSet<usereducation>();
        }

        public int InstitutionID { get; set; }

        [StringLength(25)]
        public string DeptOfEdInstitutionID { get; set; }

        [Required]
        [StringLength(200)]
        public string InstitutionName { get; set; }

        [StringLength(200)]
        public string InstitutionAddress { get; set; }

        [StringLength(100)]
        public string InstitutionCity { get; set; }

        [StringLength(25)]
        public string InstitutionState { get; set; }

        public int? StateProvinceID { get; set; }

        [StringLength(25)]
        public string InstitutionZip { get; set; }

        [StringLength(25)]
        public string InstitutionPhone { get; set; }

        [StringLength(25)]
        public string InstitutionOPEID { get; set; }

        [StringLength(25)]
        public string InstitutionIPEDSUnitID { get; set; }

        [StringLength(2083)]
        public string InstitutionURL { get; set; }

        public int? CountryID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public virtual stateprovince stateprovince { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<usereducation> usereducations { get; set; }
    }
}
