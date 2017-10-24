namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class OwnerStatus
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public OwnerStatus()
        {
            users = new HashSet<user>();
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int OwnserStatusID { get; set; }

        [Required]
        [StringLength(50)]
        public string OwnerStatusName { get; set; }

        [StringLength(200)]
        public string OwnerStatusDescription { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        public bool Active { get; set; }

        [StringLength(3)]
        public string UpdatedBy { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<user> users { get; set; }
    }
}
