namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class accountstatus
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public accountstatus()
        {
            userprofilepositions = new HashSet<userprofileposition>();
            users = new HashSet<user>();
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int AccountStatusID { get; set; }

        [Required]
        [StringLength(25)]
        public string AccountStatusName { get; set; }

        [StringLength(200)]
        public string AccountStatusDescription { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<userprofileposition> userprofilepositions { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<user> users { get; set; }
    }
}
