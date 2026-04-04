import json
import numpy as np
import pandas as pd
import os
import datamapplot

def main():
    print("Loading topic data...")
    with open('../data/topic_assignments.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    points = data['points']
    topics_map = data['topics']

    print("Extracting coordinates and labels...")
    coords = np.array([[p['x'], p['y']] for p in points])
    labels = np.array([topics_map.get(str(p['topic']), f"Topic {p['topic']}") for p in points])
    hover_texts = [p.get('text', '')[:200] + '...' for p in points]

    print("Generating DataMapPlot (this may take a minute)...")
    # Using the standard create_interactive_plot api
    plot = datamapplot.create_interactive_plot(
        coords, 
        labels,
        hover_text=hover_texts,
        enable_search=True,
        darkmode=True,
        title="SimPPL Narrative DataMapPlot",
        sub_title="Interactive UMAP Embedding Space"
    )
    
    # Needs to be output as html.
    output_path = '../frontend/public/interactive_map.html'
    
    if hasattr(plot, 'save'):
        plot.save(output_path)
    else:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(plot)
            
    # Post-process the generated HTML to add custom UI controls
    post_process_html(output_path)
    print(f"Successfully generated map at {output_path}")

def post_process_html(file_path):
    print("Post-processing HTML to add interactive controls...")
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Inject CSS to hide redundant headers (title/search)
    custom_css = """
    <style>
        .stack.top-left { display: none !important; }
        #loading { background: #000 !important; }
    </style>
    """
    html = html.replace('</head>', f'{custom_css}</head>')

    # 2. Inject Robust Zoom Listener for dashboard communication
    custom_js = """
    // =========================================================================
    // Robust Zoom & Reset Listener (Injected)
    // =========================================================================
    let initialViewState = null;
    window.addEventListener('message', function(event) {
        const dm = window.datamap;
        if (!dm || !dm.deckgl) return;
        
        const deckgl = dm.deckgl;
        const current = deckgl.viewManager.getViewState();
        
        // Initialize start state if needed
        if (!initialViewState && current && typeof current.zoom !== 'undefined') {
            initialViewState = { 
                latitude: current.latitude, 
                longitude: current.longitude, 
                zoom: current.zoom,
                pitch: current.pitch || 0,
                bearing: current.bearing || 0
            };
        }

        const updateViewState = (updates) => {
            deckgl.setProps({
                viewState: {
                    ...current,
                    ...updates,
                    transitionDuration: 350,
                    transitionInterpolator: new deck.LinearInterpolator()
                }
            });
        };

        switch (event.data.type) {
            case 'ZOOM_IN':
                updateViewState({ zoom: (current.zoom || 0) + 0.6 });
                break;
            case 'ZOOM_OUT':
                updateViewState({ zoom: Math.max(0, (current.zoom || 0) - 0.6) });
                break;
            case 'RESET_ZOOM':
                if (initialViewState) {
                    deckgl.setProps({
                        viewState: {
                            ...initialViewState,
                            transitionDuration: 600,
                            transitionInterpolator: new deck.FlyToInterpolator()
                        }
                    });
                }
                break;
        }
    });

    """
    # Find the last </script> tag or append to the end of the first one
    if '</script>' in html:
        # We append just before the LAST script tag's end
        parts = html.rsplit('</script>', 1)
        html = parts[0] + custom_js + '</script>' + parts[1]
    else:
        # Fallback if no script tag found (unlikely for datamapplot)
        html = html.replace('</body>', f'<script>{custom_js}</script></body>')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == "__main__":
    main()
