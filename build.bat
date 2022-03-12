REM  create a new build for QuickFolders
set /P quickFoldersRev=<revision.txt
set /a oldRev=%quickFoldersRev%
set /a quickFoldersRev+=1
REM replace previous rev with new
pwsh -Command "(gc -en UTF8NoBOM manifest.json) -replace 'pre%oldRev%', 'pre%quickFoldersRev%' | Out-File manifest.json"
"C:\Program Files\7-Zip\7z" a -xr!.svn QuickFoldersWeb.zip manifest.json _locales scripts chrome popup license.txt *.js *.html
echo %quickFoldersRev% > revision.txt
move QuickFolders*.xpi "..\_Test\QuickFolders\5.10\"
pwsh -Command "Start-Sleep -m 150"
rename QuickFoldersWeb.zip QuickFolders-mx-5.10pre%quickFoldersRev%.xpi