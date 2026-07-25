{{-- resources/views/app.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
    @if(app()->environment('local'))
    <script type="module">
        import RefreshRuntime from 'http://localhost:5173/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => () => {}
        window.__vite_plugin_react_preamble_installed__ = true
    </script>
    @endif
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
