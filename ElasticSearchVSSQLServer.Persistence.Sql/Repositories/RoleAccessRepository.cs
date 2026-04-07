//namespace ElasticSearchVSSQLServer.Persistence.Sql.Repositories
//{
//    using ElasticSearchVSSQLServer.Domain.Repositories;
//    //using ElasticSearchVSSQLServer.Persistence.RoleAccess;
//    using global::ElasticSearchVSSQLServer.Persistence.Sql.Context;
//    using Microsoft.EntityFrameworkCore;
//    using System.Collections.Generic;
//    using System.Linq;
//    using System.Threading.Tasks;

//    public class RoleAccessRepository(ApplicationDBService dbContext) : IRoleAccessRepository
//    {
//        private ApplicationDbContext _dbContext = dbContext.DbContext;

        //public async Task<RoleAccessDTO> GetRoleTableAccessAsync(string roleId, string tableName)
        //{
        //    var entity = await _dbContext.RoleAccess
        //        .AsNoTracking()
        //        .FirstOrDefaultAsync(r => r.Role.Name == roleId
        //            && r.TableName == tableName
        //            && r.FieldName == null);
        //    if (entity == null)
        //        return null;

        //    return new RoleAccessDTO
        //    {
        //        RoleId = entity.RoleId,
        //        TableName = entity.TableName,
        //        FieldName = entity.FieldName,
        //        HasAccess = entity.HasAccess
        //    };
        //}

        //public async Task<IEnumerable<RoleAccessDTO>> GetRoleFieldAccessAsync(string roleId, string tableName)
        //{
        //    var entities = await _dbContext.RoleAccess
        //        .AsNoTracking()
        //        .Where(r => r.Role.Name == roleId
        //            && r.TableName == tableName
        //            && r.FieldName != null)
        //        .ToListAsync();

        //    return entities.Select(e => new RoleAccessDTO
        //    {
        //        RoleId = e.RoleId,
        //        TableName = e.TableName,
        //        FieldName = e.FieldName,
        //        HasAccess = e.HasAccess
        //    });
        //}

        //public async Task<bool> HasAccessToAction(string role, string actionName, string controllerName, string userId)
        //{
        //    return await _dbContext.ModuleOperationAction.AnyAsync(x => x.Action.Name == actionName &&
        //    x.Action.Controller.Name == controllerName
        //    && (x.ModuleOperation.ModuleOperationRole.Any(mor => mor.Role.Name == role && mor.Active) ||
        //    x.ModuleOperation.ModuleOperationUser.Any(mou => mou.Active && mou.UserId == userId)));
        //}
//    }
//}
