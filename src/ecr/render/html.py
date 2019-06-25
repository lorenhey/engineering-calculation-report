import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

from ecr.core.project import Project

def render_html(project: Project, output_path: str):
    env = Environment(
        loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), '..', 'templates'))
    )
    template = env.get_template('report.html')
    
    # Pre-process variables and equations for rendering
    vars_list = list(project.engine.variables.values())
    eqs_list = []
    
    # We want to display equations in evaluation order
    order = project.engine.get_evaluation_order()
    for eq_id in order:
        eq = project.engine.equations[eq_id]
        lhs_sym, rhs_expr = project.engine.parse_equation(eq.expresion)
        target_var = next((v for v in vars_list if v.simbolo == lhs_sym), None)
        
        eqs_list.append({
            'def': eq,
            'target': target_var
        })
        
    html = template.render(
        project=project,
        variables=vars_list,
        equations=eqs_list,
        checks=list(project.engine.checks.values())
    )
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
