import typer
from pathlib import Path
from rich.console import Console
from rich.table import Table

from ecr.core.project import Project
from ecr.render.html import render_html
from ecr.core.engine import EngineError

app = typer.Typer(help="Engineering Calculation Report CLI")
console = Console()

@app.command()
def new(name: str):
    """Create a new project template."""
    proj_dir = Path(name)
    proj_dir.mkdir(exist_ok=True)
    
    yaml_content = f"""proyecto: "{proj_dir.name}"

variables:
  D:
    descripcion: Diámetro interior
    valor: 52.5
    unidad: mm
    fuente: 
      tipo: dato_proyecto
  Q:
    descripcion: Caudal
    valor: 25
    unidad: m^3/h
  A:
    descripcion: Área de la sección transversal
    unidad: m^2
  v:
    descripcion: Velocidad del fluido
    unidad: m/s

ecuaciones:
  area:
    nombre: Cálculo de Área
    expresion: A = 3.14159265 * D**2 / 4
  velocidad:
    nombre: Cálculo de Velocidad
    expresion: v = Q / A

verificaciones:
  vel_max:
    descripcion: Verificación de velocidad máxima
    expresion: v <= 3 m/s
    severidad: warning
"""
    with open(proj_dir / "calculation.yaml", "w", encoding="utf-8") as f:
        f.write(yaml_content)
        
    console.print(f"[green]Project '{name}' created at {proj_dir.absolute()}[/green]")

@app.command()
def calculate(path: str):
    """Execute calculations for a project."""
    try:
        p = Path(path)
        if p.is_dir():
            p = p / "calculation.yaml"
            
        proj = Project.from_yaml(p)
        proj.calculate()
        
        console.print("[green]Calculation successful![/green]")
        
        table = Table(title="Resultados", show_header=True)
        table.add_column("Variable")
        table.add_column("Valor")
        table.add_column("Unidad")
        
        for var in proj.engine.variables.values():
            if var._calculated_value is not None:
                table.add_row(var.simbolo, f"{var._calculated_value.magnitude:.4g}", str(var._calculated_value.units))
                
        console.print(table)
        
        check_table = Table(title="Verificaciones", show_header=True)
        check_table.add_column("Check")
        check_table.add_column("Expresión")
        check_table.add_column("Resultado")
        
        for chk in proj.engine.checks.values():
            status = "[green]CUMPLE[/green]" if chk._passed else "[red]NO CUMPLE[/red]"
            check_table.add_row(chk.id, chk.expresion, status)
            
        console.print(check_table)
        
    except EngineError as e:
        console.print(f"[red]Error de motor: {e}[/red]")
        raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[red]Error inesperado: {e}[/red]")
        raise typer.Exit(code=1)

@app.command()
def report(path: str, out: str = "report.html"):
    """Generate HTML report."""
    try:
        p = Path(path)
        if p.is_dir():
            p = p / "calculation.yaml"
            
        proj = Project.from_yaml(p)
        proj.calculate()
        
        out_path = Path(out)
        render_html(proj, str(out_path))
        
        console.print(f"[green]Report generated at {out_path.absolute()}[/green]")
    except Exception as e:
        console.print(f"[red]Error generating report: {e}[/red]")
        raise typer.Exit(code=1)

@app.command()
def demo():
    """Run a quick demonstration."""
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        new(tmpdir)
        console.print("\n[bold blue]--- Ejecutando cálculo ---[/bold blue]")
        calculate(tmpdir)
        console.print("\n[bold blue]--- Generando informe ---[/bold blue]")
        report(tmpdir, out="demo_report.html")

if __name__ == "__main__":
    app()
