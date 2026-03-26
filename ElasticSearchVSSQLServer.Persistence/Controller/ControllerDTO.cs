namespace ElasticSearchVSSQLServer.Persistence.Controller;

public class ControllerDTO {
    public int ControllerId { get; set; }
    public string Name { get; set; }
    public bool Active { get; set; }
    public IEnumerable<ActionDTO> Actions { get; set; }
}
