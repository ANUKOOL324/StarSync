import os
import subprocess

def run_cmd(args):
    result = subprocess.run(args, capture_output=True, text=True, check=True)
    return result.stdout

# Define file paths
landing_path = 'Starsync_frontend/src/pages/LandingPage.tsx'
css_path = 'Starsync_frontend/src/index.css'
dashboard_path = 'Starsync_frontend/src/pages/DashboardPage.tsx'

# 1. Read the final (current) contents
with open(landing_path, 'r', encoding='utf-8') as f:
    final_landing = f.read().replace('\r\n', '\n')
with open(css_path, 'r', encoding='utf-8') as f:
    final_css = f.read().replace('\r\n', '\n')
with open(dashboard_path, 'r', encoding='utf-8') as f:
    final_dashboard = f.read().replace('\r\n', '\n')

# 2. Get the original contents from git
original_landing = run_cmd(['git', 'show', 'HEAD:' + landing_path]).replace('\r\n', '\n')
original_css = run_cmd(['git', 'show', 'HEAD:' + css_path]).replace('\r\n', '\n')
original_dashboard = run_cmd(['git', 'show', 'HEAD:' + dashboard_path]).replace('\r\n', '\n')

# Reset git state to HEAD
run_cmd(['git', 'reset', '--hard', 'HEAD'])

try:
    # --- COMMIT 1: Clean up mock editor title and card border ---
    v1_landing = original_landing
    # Replace title
    v1_landing = v1_landing.replace(
        '<span className="ml-2 font-mono text-[11px] text-zinc-500">\n            StarSync Desktop - session_04.flow\n          </span>',
        '<span className="ml-2 font-mono text-[11px] text-zinc-500">\n            StarSync\n          </span>'
    )
    # Replace AppPreview border to gradient
    v1_landing = v1_landing.replace(
        '      <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#18181B]/70 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl">',
        '      <div className="relative rounded-xl bg-gradient-to-b from-[#5A5A5C] via-white/15 to-[#28282A] p-[1px] shadow-2xl shadow-black/50">\n        <div className="relative overflow-hidden rounded-[11px] bg-[#18181B]/80 p-3 backdrop-blur-2xl">'
    )
    # Add closing div for gradient border wrapper
    v1_landing = v1_landing.replace(
        '      </div>\n    </motion.div>\n  )\n}',
        '        </div>\n      </div>\n    </motion.div>\n  )\n}'
    )
    
    with open(landing_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(v1_landing)
    
    run_cmd(['git', 'add', landing_path])
    run_cmd(['git', 'commit', '-m', 'clean up mock editor title and style preview card border'])
    print("Commit 1 successful")

    # --- COMMIT 2: Refine mobile navigation header and dropdown buttons ---
    v2_landing = v1_landing
    header_start_final = final_landing.find('<header')
    header_end_final = final_landing.find('</header>') + len('</header>')
    final_header_content = final_landing[header_start_final:header_end_final]
    
    header_start_orig = v2_landing.find('<header')
    header_end_orig = v2_landing.find('</header>') + len('</header>')
    
    print(f"final header: start={header_start_final}, end={header_end_final}, len={len(final_header_content)}")
    print(f"orig header: start={header_start_orig}, end={header_end_orig}")
    
    v2_landing = v2_landing[:header_start_orig] + final_header_content + v2_landing[header_end_orig:]
    
    with open(landing_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(v2_landing)
        
    run_cmd(['git', 'add', landing_path])
    # Let's check status before committing
    status = run_cmd(['git', 'status'])
    print("Git status before Commit 2:\n", status)
    
    run_cmd(['git', 'commit', '-m', 'move sign in button inside mobile menu and adjust button widths'])
    print("Commit 2 successful")

    # --- COMMIT 3: Add mock console panel to landing page preview ---
    v3_landing = v2_landing
    console_block = """            {/* Console Panel */}
            <div className="mt-5 border-t border-white/5 pt-4">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <span>Console</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] leading-relaxed text-zinc-500">
                <p>
                  <span className="text-zinc-600">system &gt;</span> connecting to StarSync node...
                </p>
                <p>
                  <span className="text-zinc-600">system &gt;</span> buffer synced. session active.
                </p>
                <p className="text-zinc-300">
                  <span className="text-zinc-600">engine &gt;</span> broadcast success: state=&apos;ACTIVE&apos; (12ms)
                </p>
              </div>
            </div>"""
    
    # Let's do a very robust replacement using the exact lines from v3_landing
    target_to_replace = "                <p>&nbsp;&nbsp;{'}'});</p>\n                <p>{'}'}</p>\n              </div>\n            </div>\n        </div>"
    replacement_content = "                <p>&nbsp;&nbsp;{'}'});</p>\n                <p>{'}'}</p>\n              </div>\n            </div>\n\n" + console_block + "\n        </div>"
    
    if target_to_replace in v3_landing:
        v3_landing = v3_landing.replace(target_to_replace, replacement_content)
    else:
        print("Warning: exact target for console block not found, trying fallback...")
        v3_landing = v3_landing.replace(
            "                <p>{'}'}</p>\n              </div>\n            </div>\n        </div>",
            "                <p>{'}'}</p>\n              </div>\n            </div>\n\n" + console_block + "\n        </div>"
        )
    
    with open(landing_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(v3_landing)
        
    run_cmd(['git', 'add', landing_path])
    run_cmd(['git', 'commit', '-m', 'add mock console panel to landing page editor preview'])
    print("Commit 3 successful")

    # --- COMMIT 4: Implement dynamic scrollbar color transition ---
    with open(landing_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(final_landing)
    with open(css_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(final_css)
        
    run_cmd(['git', 'add', landing_path, css_path])
    run_cmd(['git', 'commit', '-m', 'add dynamic scrollbar color transition on scroll'])
    print("Commit 4 successful")

    # --- COMMIT 5: Align dashboard layout and style headings ---
    with open(dashboard_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(final_dashboard)
        
    run_cmd(['git', 'add', dashboard_path])
    run_cmd(['git', 'commit', '-m', 'align dashboard header borders and style headings with brand gradient'])
    print("Commit 5 successful")

    # --- PUSH TO GITHUB ---
    print("Pushing to remote...")
    push_result = run_cmd(['git', 'push', 'origin', 'master'])
    print("Push successful:", push_result)

except Exception as e:
    print("Error occurred, restoring final files...", e)
    with open(landing_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(final_landing)
    with open(css_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(final_css)
    with open(dashboard_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(final_dashboard)
    raise e
